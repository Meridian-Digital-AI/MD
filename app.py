"""Flask web app — onboarding, Stripe subscription verification, and campaign review.

Billing lives on the Meridian Digital marketing website. Clients buy a plan
there, then sign in here with the same email — we verify the active Stripe
subscription on login/onboarding and grant access if it checks out.
"""

from __future__ import annotations

import os
import re
import json
import threading
from datetime import date
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

from flask import (
    Flask, render_template, request, redirect, url_for,
    jsonify, make_response, abort,
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import database as db
import stripe_config
import email_service
import campaign_pusher
from models import BusinessInfo
from campaign_builder import build_campaign

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

MARKETING_SITE_URL = os.environ.get(
    "MARKETING_SITE_URL", "https://meridiandigital.co.uk"
)

# Comma-separated list of emails allowed to access /admin. Matches are case-
# insensitive and trimmed. Empty (default) = admin view disabled.
ADMIN_EMAILS = {
    e.strip().lower()
    for e in (os.environ.get("ADMIN_EMAILS") or "").split(",")
    if e.strip()
}

# ─── Rate limiting ────────────────────────────────────────────────────────────
#
# Protects expensive endpoints so a single customer (or a bad actor) can't
# fire the Claude API 50 times in a minute. We key by session token if the
# user is signed in (so shared-IP offices aren't all throttled together),
# falling back to IP address otherwise.
#
# Storage is in-memory — fine for a single-process Flask dev server and for
# Will's deployment target (single worker). If we scale horizontally, swap
# storage_uri to redis://… so workers share counters.

def _rate_limit_key():
    token = request.cookies.get("session_token")
    return token or get_remote_address()

limiter = Limiter(
    key_func=_rate_limit_key,
    app=app,
    storage_uri="memory://",
    # Default limits apply to *every* route unless overridden — a belt-and-
    # braces cap so no endpoint is accidentally unlimited.
    default_limits=["200 per hour"],
    # GETs that just render pages are cheap — exempt them from the default
    # by not decorating them. Anything with @limiter.limit() below opts in.
    headers_enabled=True,
)


@app.errorhandler(429)
def ratelimit_handler(e):
    retry_after = getattr(e, "retry_after", None)
    return render_template(
        "rate_limited.html",
        description=str(getattr(e, "description", "Too many requests.")),
        retry_after=retry_after,
    ), 429


# ─── Session helper ───────────────────────────────────────────────────────────

def get_current_customer():
    token = request.cookies.get("session_token")
    if not token:
        return None
    return db.get_customer_by_token(token)


@app.context_processor
def inject_current_customer():
    return {"current_customer": get_current_customer()}


@app.context_processor
def inject_current_year():
    return {"current_year": date.today().year}


@app.context_processor
def inject_marketing_site_url():
    return {"marketing_site_url": MARKETING_SITE_URL}


def require_admin(f):
    """Admin gate: signed-in customer *and* email in ADMIN_EMAILS.

    We deliberately 404 (not 403) when the check fails so outsiders can't
    probe for an admin route's existence.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        customer = get_current_customer()
        if not customer:
            abort(404)
        email = (customer.get("email") or "").lower()
        if not ADMIN_EMAILS or email not in ADMIN_EMAILS:
            abort(404)
        return f(customer, *args, **kwargs)
    return decorated


def require_session(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        customer = get_current_customer()
        if not customer:
            return redirect(url_for("onboarding"))
        # Subscription might have been cancelled since they last signed in
        # (Stripe webhook sets status to 'canceled'). Kick them out cleanly.
        if customer.get("subscription_status") == "canceled":
            resp = make_response(render_template(
                "no_subscription.html",
                email=customer["email"],
                marketing_site_url=MARKETING_SITE_URL,
            ), 402)
            resp.delete_cookie("session_token")
            return resp
        return f(customer, *args, **kwargs)
    return decorated


# ─── Background campaign generation ──────────────────────────────────────────

def generate_campaign_task(customer_id, submission_id, campaign_id):
    """Run campaign generation in a background thread."""
    try:
        sub = db.get_submission(submission_id)
        usps = json.loads(sub["usps"]) if isinstance(sub["usps"], str) else sub["usps"]

        business = BusinessInfo(
            business_name=sub["business_name"],
            industry=sub["industry"],
            location=sub["location"],
            service_area=sub["service_area"],
            monthly_budget_gbp=float(sub["monthly_budget"]),
            goal=sub["goal"],
            usps=usps,
            target_audience=sub["target_audience"],
            website_url=sub.get("website_url") or None,
            phone_number=sub.get("phone_number") or None,
            additional_context=sub.get("additional_context") or None,
        )

        platforms = sub.get("platforms", "google_ads,meta_ads").split(",")
        campaign = build_campaign(business, platforms=platforms)
        campaign_json = json.dumps(campaign.model_dump(), indent=2)
        db.update_campaign(campaign_id, campaign_json=campaign_json, status="ready")

        # Notify customer that their campaign is ready
        try:
            conn = db.get_db()
            cust = conn.execute(
                "SELECT email FROM customers WHERE id = ?", (customer_id,)
            ).fetchone()
            conn.close()
            if cust:
                email_service.send_campaign_ready(
                    cust["email"], sub["business_name"], campaign_id
                )
        except Exception as mail_err:
            print(f"[email] campaign_ready failed: {mail_err}")

    except Exception as e:
        db.update_campaign(campaign_id, status="error", error_message=str(e))


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    # Already signed in? Drop them at their dashboard. Otherwise /login.
    customer = get_current_customer()
    if customer:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/onboarding", methods=["GET"])
def onboarding():
    # Pre-fill form for returning customers
    prefill = {}
    customer = get_current_customer()
    if customer:
        prefill["email"] = customer["email"]
        sub = db.get_latest_submission(customer["id"])
        if sub:
            prefill.update(sub)
    return render_template("onboarding.html", prefill=prefill)


@app.route("/onboarding", methods=["POST"])
@limiter.limit("5 per hour")
def onboarding_submit():
    data = request.form.to_dict(flat=False)
    # Flatten single-value fields, keep platforms as list
    platforms = data.get("platforms", ["google_ads", "meta_ads"])
    data = {k: v[0] if len(v) == 1 else v for k, v in data.items()}
    data["platforms"] = ",".join(platforms)

    # Parse USPs from comma-separated or multi-line input
    raw_usps = data.get("usps", "")
    usps = [u.strip() for u in raw_usps.replace("\n", ",").split(",") if u.strip()]
    data["usps"] = usps

    email = data.get("email", "").strip().lower()
    if not email:
        return render_template("onboarding.html", error="Email is required"), 400

    # Internal tool — only operators on ADMIN_EMAILS can submit campaigns.
    # No Stripe check: clients never see this app.
    if not ADMIN_EMAILS or email not in ADMIN_EMAILS:
        return render_template(
            "onboarding.html",
            error="That email isn't on the operator list. Ping Joe or Will to get added.",
            prefill=data,
        ), 403

    # Reuse the operator's customer record across campaigns — each submission
    # captures the *client's* business details, the customer row is just the
    # operator's account/session anchor.
    existing = db.get_customer_by_email(email)
    if existing:
        customer_id = existing["id"]
        token = db.refresh_session_token(customer_id)
    else:
        customer_id, token = db.create_customer(email, plan="internal")
    submission_id = db.save_submission(customer_id, data)

    # Welcome email (fire-and-forget — don't block redirect on email failure)
    try:
        email_service.send_welcome(email, data.get("business_name", "there"))
    except Exception as e:
        app.logger.warning(f"Welcome email failed: {e}")

    # Kick off campaign generation immediately — they've already paid on the
    # website, so no internal checkout step needed.
    campaign_id = db.create_campaign(customer_id, submission_id)
    thread = threading.Thread(
        target=generate_campaign_task,
        args=(customer_id, submission_id, campaign_id),
    )
    thread.start()

    resp = make_response(redirect(url_for("success")))
    resp.set_cookie("session_token", token, httponly=True, samesite="Lax", max_age=60*60*24*30)
    return resp


@app.route("/success")
@require_session
def success(customer):
    # Find the latest campaign for this customer
    conn = db.get_db()
    row = conn.execute(
        "SELECT id, status FROM campaigns WHERE customer_id = ? ORDER BY id DESC LIMIT 1",
        (customer["id"],),
    ).fetchone()
    conn.close()

    if row:
        return render_template("generating.html", campaign_id=row["id"])

    # No campaign yet — might be a direct visit. Trigger generation.
    sub = db.get_latest_submission(customer["id"])
    if sub:
        campaign_id = db.create_campaign(customer["id"], sub["id"])
        thread = threading.Thread(
            target=generate_campaign_task,
            args=(customer["id"], sub["id"], campaign_id),
        )
        thread.start()
        return render_template("generating.html", campaign_id=campaign_id)

    return redirect(url_for("onboarding"))


@app.route("/campaign/<int:campaign_id>/status")
@require_session
def campaign_status(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    return jsonify({"status": campaign["status"], "error": campaign.get("error_message")})


@app.route("/campaign/<int:campaign_id>/ad-preview")
@require_session
def ad_preview(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    data = json.loads(campaign["campaign_json"])
    return render_template("ad_preview.html", campaign=data, campaign_id=campaign_id)


@app.route("/campaign/<int:campaign_id>")
@require_session
def campaign_review(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)

    if campaign["status"] == "generating":
        return render_template("generating.html", campaign_id=campaign_id)

    if campaign["status"] == "error":
        return render_template("error.html", error=campaign.get("error_message", "Unknown error"), campaign_id=campaign_id)

    if campaign["status"] == "pushing":
        return render_template("pushing.html", campaign_id=campaign_id)

    data = json.loads(campaign["campaign_json"])
    return render_template("review.html", campaign=data, campaign_id=campaign_id,
                           campaign_status=campaign["status"],
                           google_push_status=campaign.get("google_push_status"),
                           meta_push_status=campaign.get("meta_push_status"),
                           google_campaign_id=campaign.get("google_campaign_id"),
                           meta_campaign_id=campaign.get("meta_campaign_id"))


# ─── Campaign editing (v1: copy only) ────────────────────────────────────────
#
# Customers can tweak ad copy before approving. We keep the editable surface
# small on purpose: headlines, descriptions, callouts, sitelink text, and the
# Meta ad copy fields. Keywords, audiences, budgets, and structural edits
# stay read-only for v1 — those need their own UX pass.
#
# Form field names encode the JSON path, e.g.
#   google_ads.ads.0.headlines.2
#   meta_ads.ads.1.primary_text
# The whitelist below is the only way we'll write into campaign_json, so a
# crafted form can't touch budgets, audiences, or anything else.

EDITABLE_PATH_PATTERNS = [
    # Google Ads — per-ad copy
    re.compile(r"^google_ads\.ads\.\d+\.headlines\.\d+$"),
    re.compile(r"^google_ads\.ads\.\d+\.descriptions\.\d+$"),
    re.compile(r"^google_ads\.callout_extensions\.\d+$"),
    re.compile(
        r"^google_ads\.sitelink_extensions\.\d+\."
        r"(link_text|description_1|description_2|final_url_path)$"
    ),
    # Google Ads — keyword rows (kept in sync with DICT_ARRAY_SCHEMAS below)
    re.compile(
        r"^google_ads\.ad_groups\.\d+\.keywords\.\d+\.(keyword|match_type)$"
    ),
    # Google Ads — per-ad-group negative keywords
    re.compile(r"^google_ads\.ad_groups\.\d+\.negative_keywords\.\d+$"),
    # Meta Ads — per-ad copy
    re.compile(
        r"^meta_ads\.ads\.\d+\."
        r"(primary_text|headline|description|visual_brief)$"
    ),
    # Meta Ads — audience scalars
    re.compile(
        r"^meta_ads\.audience\."
        r"(age_min|age_max|genders|lookalike_suggestion)$"
    ),
    # Meta Ads — audience list entries
    re.compile(r"^meta_ads\.audience\.(interests|behaviours|locations)\.\d+$"),
]

# Paths whose *entire array* can be rebuilt from the form. Needed for
# add/remove — a scalar-path write can only overwrite an existing index.
#
# Primitive arrays: list[str]
PRIMITIVE_ARRAY_PATTERNS = [
    re.compile(r"^google_ads\.ads\.\d+\.headlines$"),
    re.compile(r"^google_ads\.ads\.\d+\.descriptions$"),
    re.compile(r"^google_ads\.callout_extensions$"),
    re.compile(r"^google_ads\.ad_groups\.\d+\.negative_keywords$"),
    re.compile(r"^meta_ads\.audience\.interests$"),
    re.compile(r"^meta_ads\.audience\.behaviours$"),
    re.compile(r"^meta_ads\.audience\.locations$"),
]

# Dict-array paths: list[dict] with a fixed allowed set of sub-fields.
# Any sub-field not in the allowed set is silently dropped on rebuild.
DICT_ARRAY_SCHEMAS = [
    (
        re.compile(r"^google_ads\.ad_groups\.\d+\.keywords$"),
        {"keyword", "match_type"},
    ),
    (
        re.compile(r"^google_ads\.sitelink_extensions$"),
        {"link_text", "description_1", "description_2", "final_url_path"},
    ),
]

# Scalar fields that must be cast to int on save (form values arrive as str).
INT_FIELDS = {"meta_ads.audience.age_min", "meta_ads.audience.age_max"}


def _is_editable_path(key):
    return any(p.match(key) for p in EDITABLE_PATH_PATTERNS)


def _is_primitive_array_path(path):
    return any(p.match(path) for p in PRIMITIVE_ARRAY_PATTERNS)


def _dict_array_schema(path):
    for pattern, fields in DICT_ARRAY_SCHEMAS:
        if pattern.match(path):
            return fields
    return None


def _set_nested(obj, path_parts, value):
    """Walk `obj` following `path_parts` and set the final key/index to value."""
    cursor = obj
    for part in path_parts[:-1]:
        cursor = cursor[int(part)] if part.isdigit() else cursor[part]
    last = path_parts[-1]
    if last.isdigit():
        cursor[int(last)] = value
    else:
        cursor[last] = value


def _coerce_value(path, value):
    """Cast string form values to the right type for specific paths."""
    value = value.strip() if isinstance(value, str) else value
    if path in INT_FIELDS:
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0
    return value


def _rebuild_primitive_array(form, path):
    """Collect all form entries shaped `{path}.{n}=value`, sort by n, return list."""
    prefix = path + "."
    entries = []
    for key in form.keys():
        if not key.startswith(prefix):
            continue
        suffix = key[len(prefix):]
        if not suffix.isdigit():
            continue
        # getlist handles duplicate names, but these are unique so [0] is fine
        val = (form.get(key) or "").strip()
        entries.append((int(suffix), val))
    entries.sort(key=lambda e: e[0])
    # Drop empty rows — that's how the UI expresses "delete this one".
    return [v for _, v in entries if v]


def _rebuild_dict_array(form, path, allowed_fields):
    """Collect all form entries shaped `{path}.{n}.{field}=value` into list[dict]."""
    prefix = path + "."
    buckets: dict[int, dict] = {}
    for key in form.keys():
        if not key.startswith(prefix):
            continue
        rest = key[len(prefix):]
        parts = rest.split(".", 1)
        if len(parts) != 2:
            continue
        idx_str, field = parts
        if not idx_str.isdigit() or field not in allowed_fields:
            continue
        val = (form.get(key) or "").strip()
        buckets.setdefault(int(idx_str), {})[field] = val
    out = []
    for idx in sorted(buckets.keys()):
        entry = buckets[idx]
        # Drop rows where every field is blank (user deleted the row).
        if not any(v for v in entry.values()):
            continue
        out.append(entry)
    return out


@app.route("/campaign/<int:campaign_id>/edit", methods=["GET"])
@require_session
def campaign_edit(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    # Only editable before approval — after that, changes could desync with
    # what's already been pushed (or is about to be).
    if campaign["status"] != "ready":
        return redirect(url_for("campaign_review", campaign_id=campaign_id))
    data = json.loads(campaign["campaign_json"])
    return render_template("edit.html", campaign=data, campaign_id=campaign_id)


@app.route("/campaign/<int:campaign_id>/edit", methods=["POST"])
@require_session
def campaign_edit_submit(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    if campaign["status"] != "ready":
        abort(400)

    data = json.loads(campaign["campaign_json"])

    # ── Pass 1: rebuild whitelisted arrays in full ──────────────────────────
    # The form declares which arrays to rebuild via hidden 'array_paths'
    # inputs. This is how add/remove works: the DOM keeps every remaining
    # row numbered 0..N-1, and we replace the whole array in one shot.
    rebuilt_paths = set()
    declared_array_paths = set(request.form.getlist("array_paths"))
    for array_path in declared_array_paths:
        if _is_primitive_array_path(array_path):
            new_arr = _rebuild_primitive_array(request.form, array_path)
            try:
                _set_nested(data, array_path.split("."), new_arr)
                rebuilt_paths.add(array_path)
            except (KeyError, IndexError, ValueError):
                continue
        else:
            schema = _dict_array_schema(array_path)
            if schema is None:
                continue  # not whitelisted — ignore
            new_arr = _rebuild_dict_array(request.form, array_path, schema)
            try:
                _set_nested(data, array_path.split("."), new_arr)
                rebuilt_paths.add(array_path)
            except (KeyError, IndexError, ValueError):
                continue

    # ── Pass 2: scalar edits ────────────────────────────────────────────────
    # Skip any key that belongs to an array we already rebuilt (otherwise
    # we'd double-write and risk re-introducing a "deleted" row mid-loop).
    rebuilt_prefixes = tuple(p + "." for p in rebuilt_paths)
    for key, value in request.form.items():
        if key == "array_paths":
            continue
        if key.startswith(rebuilt_prefixes):
            continue
        if not _is_editable_path(key):
            continue
        try:
            _set_nested(data, key.split("."), _coerce_value(key, value))
        except (KeyError, IndexError, ValueError):
            continue

    db.update_campaign(
        campaign_id,
        campaign_json=json.dumps(data, indent=2),
        status="ready",
    )
    return redirect(url_for("campaign_review", campaign_id=campaign_id))


@app.route("/campaign/<int:campaign_id>/approve", methods=["POST"])
@require_session
def campaign_approve(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    db.update_campaign(campaign_id, status="approved",
                       campaign_json=campaign["campaign_json"])

    # Parse campaign once — used by both emails below.
    try:
        data = json.loads(campaign["campaign_json"])
    except Exception as e:
        app.logger.warning(f"Failed to parse campaign_json on approve: {e}")
        data = None

    # Confirmation email to the customer.
    if data is not None:
        try:
            business_name = data.get("business_name") or "your business"
            email_service.send_campaign_approved(customer["email"], business_name)
        except Exception as e:
            app.logger.warning(f"Approval email failed: {e}")

    # Operator notification: email Joe (OWNER_EMAIL) the full campaign so he
    # can set it up manually in Google Ads Manager / Meta Business Suite while
    # we wait for API access. Once APIs are wired, this doubles as an audit
    # trail of who approved what.
    if data is not None:
        try:
            submission = db.get_submission(campaign["submission_id"])
            email_service.send_campaign_to_owner(
                campaign_data=data,
                customer_email=customer["email"],
                submission=submission,
                campaign_id=campaign_id,
            )
        except Exception as e:
            app.logger.warning(f"Owner notification email failed: {e}")

    return redirect(url_for("thank_you"))


@app.route("/campaign/<int:campaign_id>/retry", methods=["POST"])
@limiter.limit("3 per hour")
@require_session
def campaign_retry(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    db.update_campaign(campaign_id, status="generating")
    thread = threading.Thread(
        target=generate_campaign_task,
        args=(customer["id"], campaign["submission_id"], campaign_id),
    )
    thread.start()
    return redirect(url_for("success"))


@app.route("/campaign/<int:campaign_id>/push", methods=["POST"])
@require_session
def campaign_push(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    # Allow pushing from "approved" (first attempt) or "push_failed" (retry).
    # Refusing retries from failed state used to require a manual DB fix.
    if campaign["status"] not in ("approved", "push_failed"):
        abort(400)

    db.update_campaign(campaign_id, status="pushing",
                       campaign_json=campaign["campaign_json"])
    thread = threading.Thread(
        target=push_campaign_task,
        args=(customer["id"], campaign_id),
    )
    thread.start()
    return redirect(url_for("campaign_pushing", campaign_id=campaign_id))


@app.route("/campaign/<int:campaign_id>/pushing")
@require_session
def campaign_pushing(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    # Get platforms from campaign JSON
    platforms = ["google_ads", "meta_ads"]
    if campaign.get("campaign_json"):
        data = json.loads(campaign["campaign_json"])
        platforms = data.get("platforms", platforms)
    return render_template("pushing.html", campaign_id=campaign_id, platforms=platforms)


@app.route("/campaign/<int:campaign_id>/push-status")
@require_session
def campaign_push_status(customer, campaign_id):
    campaign = db.get_campaign(campaign_id)
    if not campaign or campaign["customer_id"] != customer["id"]:
        abort(404)
    return jsonify({
        "status": campaign["status"],
        "google_push_status": campaign.get("google_push_status", "pending"),
        "meta_push_status": campaign.get("meta_push_status", "pending"),
    })


def push_campaign_task(customer_id, campaign_id):
    """Run campaign push in a background thread."""
    try:
        campaign_pusher.push_campaign_live(campaign_id)
    except Exception as e:
        db.update_campaign_push_result(campaign_id, "push_failed")


@app.route("/thank-you")
@require_session
def thank_you(customer):
    return render_template("thank_you.html", customer=customer)


# ─── Dashboard & Auth ────────────────────────────────────────────────────────

@app.route("/dashboard")
@require_session
def dashboard(customer):
    campaigns = db.get_campaigns_by_customer(customer["id"])
    return render_template("dashboard.html", customer=customer, campaigns=campaigns)


@app.route("/admin")
@require_admin
def admin_home(customer):
    customers = db.get_all_customers_with_campaign_counts()
    campaigns = db.get_all_campaigns()
    return render_template(
        "admin.html",
        admin_email=customer["email"],
        customers=customers,
        campaigns=campaigns,
    )


@app.route("/login", methods=["GET"])
def login():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
@limiter.limit("10 per 15 minutes")
def login_submit():
    email = request.form.get("email", "").strip().lower()
    if not email:
        return render_template("login.html", error="Email is required"), 400

    # Internal tool — only Joe + Will (or whoever's on ADMIN_EMAILS) can sign in.
    # No Stripe lookup: clients never see this app, so there's no subscription
    # to check. Add/remove operators by editing ADMIN_EMAILS in .env.
    if not ADMIN_EMAILS or email not in ADMIN_EMAILS:
        return render_template(
            "login.html",
            error="That email isn't on the operator list. Ping Joe or Will to get added.",
        ), 403

    existing = db.get_customer_by_email(email)
    if existing:
        customer_id = existing["id"]
        token = db.refresh_session_token(customer_id)
    else:
        customer_id, token = db.create_customer(email, plan="internal")

    # If they've never completed onboarding, drop them into onboarding.
    # Otherwise send them to their dashboard.
    has_submission = db.get_latest_submission(customer_id) is not None
    redirect_target = "dashboard" if has_submission else "onboarding"

    resp = make_response(redirect(url_for(redirect_target)))
    resp.set_cookie("session_token", token, httponly=True, samesite="Lax", max_age=60*60*24*30)
    return resp


@app.route("/logout")
def logout():
    resp = make_response(redirect(url_for("login")))
    resp.delete_cookie("session_token")
    return resp


# ─── Stripe webhooks ─────────────────────────────────────────────────────────
#
# We let the marketing website own checkout, so most Stripe events don't need
# to land here. The one we do care about is cancellation: when a customer's
# subscription ends we want to flip our local status to 'canceled' right away
# so their session stops working. Otherwise a cancelled customer could keep
# burning Claude API calls until their cookie expires.
#
# Requires STRIPE_WEBHOOK_SECRET in .env (get it from the Stripe Dashboard ->
# Developers -> Webhooks -> "Signing secret" on the endpoint you register).

@app.route("/webhooks/stripe", methods=["POST"])
@limiter.exempt
def stripe_webhook():
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature", "")
    try:
        event = stripe_config.verify_webhook(payload, sig_header)
    except stripe_config.StripeNotConfigured as e:
        app.logger.error(f"Stripe webhook rejected: {e}")
        return jsonify({"error": "not configured"}), 500
    except Exception as e:
        # Signature mismatch or malformed body — don't leak detail.
        app.logger.warning(f"Stripe webhook signature verification failed: {e}")
        return jsonify({"error": "invalid signature"}), 400

    event_type = event.get("type")
    obj = (event.get("data") or {}).get("object") or {}

    # Cancellation paths we care about:
    #   customer.subscription.deleted         — final cancellation (most common)
    #   customer.subscription.updated         — can transition into a canceled state
    if event_type == "customer.subscription.deleted":
        cust_id = obj.get("customer")
        if cust_id:
            email = db.deactivate_customer_by_stripe_id(cust_id)
            app.logger.info(f"Stripe cancel: deactivated {email or cust_id}")
    elif event_type == "customer.subscription.updated":
        status = obj.get("status")
        if status in ("canceled", "unpaid", "incomplete_expired"):
            cust_id = obj.get("customer")
            if cust_id:
                email = db.deactivate_customer_by_stripe_id(cust_id)
                app.logger.info(
                    f"Stripe {status}: deactivated {email or cust_id}"
                )

    # Other event types: we just acknowledge so Stripe stops retrying.
    return jsonify({"received": True}), 200


# ─── Legal pages ─────────────────────────────────────────────────────────────

LEGAL_LAST_UPDATED = "10 April 2026"


@app.route("/privacy")
def privacy():
    return render_template("privacy.html", last_updated=LEGAL_LAST_UPDATED)


@app.route("/terms")
def terms():
    return render_template("terms.html", last_updated=LEGAL_LAST_UPDATED)


# ─── Demo mode (skip Stripe for testing) ─────────────────────────────────────

@app.route("/demo/generate", methods=["POST"])
@require_session
def demo_generate(customer):
    """Skip Stripe and generate a campaign directly for testing."""
    db.update_customer_plan(customer["id"], "growth")
    sub = db.get_latest_submission(customer["id"])
    if not sub:
        return redirect(url_for("onboarding"))

    campaign_id = db.create_campaign(customer["id"], sub["id"])
    thread = threading.Thread(
        target=generate_campaign_task,
        args=(customer["id"], sub["id"], campaign_id),
    )
    thread.start()
    return redirect(url_for("success"))


# ─── Init ─────────────────────────────────────────────────────────────────────

db.init_db()

if __name__ == "__main__":
    # macOS reserves port 5000 for AirPlay Receiver, so default to 5001 to
    # avoid silent collisions. Override with PORT env var if needed.
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port)
