"""Flask web app — onboarding, Stripe subscription verification, and campaign review.

Billing lives on the Meridian Digital marketing website. Clients buy a plan
there, then sign in here with the same email — we verify the active Stripe
subscription on login/onboarding and grant access if it checks out.
"""

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


def require_session(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        customer = get_current_customer()
        if not customer:
            return redirect(url_for("onboarding"))
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

    email = data.get("email", "").strip()
    if not email:
        return render_template("onboarding.html", error="Email is required"), 400

    # Billing lives on the marketing website — verify the user has an active
    # subscription before letting them create a campaign.
    try:
        sub_info = stripe_config.get_active_subscription_by_email(email)
    except stripe_config.StripeNotConfigured as e:
        return render_template(
            "onboarding.html",
            error=f"Server configuration error: {e}",
            prefill=data,
        ), 500

    if not sub_info:
        return render_template(
            "no_subscription.html",
            email=email,
            marketing_site_url=MARKETING_SITE_URL,
        ), 402

    # Create/get customer (now with plan details from Stripe) and save submission.
    customer_id, token = db.create_customer(
        email,
        plan=sub_info.get("tier_id"),
        stripe_customer_id=sub_info.get("stripe_customer_id"),
    )
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
    re.compile(r"^google_ads\.ads\.\d+\.headlines\.\d+$"),
    re.compile(r"^google_ads\.ads\.\d+\.descriptions\.\d+$"),
    re.compile(r"^google_ads\.callout_extensions\.\d+$"),
    re.compile(
        r"^google_ads\.sitelink_extensions\.\d+\."
        r"(link_text|description_1|description_2|final_url_path)$"
    ),
    re.compile(
        r"^meta_ads\.ads\.\d+\."
        r"(primary_text|headline|description|visual_brief)$"
    ),
]


def _is_editable_path(key):
    return any(p.match(key) for p in EDITABLE_PATH_PATTERNS)


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
    for key, value in request.form.items():
        if not _is_editable_path(key):
            # Silently skip unknown/blocked paths — we don't want a stray field
            # to crash the save or open a write-anywhere hole.
            continue
        try:
            _set_nested(data, key.split("."), value.strip())
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
    if campaign["status"] not in ("approved",):
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


@app.route("/login", methods=["GET"])
def login():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login_submit():
    email = request.form.get("email", "").strip().lower()
    if not email:
        return render_template("login.html", error="Email is required"), 400

    # Source of truth: Stripe. Check for an active subscription on this email.
    try:
        sub_info = stripe_config.get_active_subscription_by_email(email)
    except stripe_config.StripeNotConfigured as e:
        return render_template(
            "login.html",
            error=f"Server configuration error: {e}",
        ), 500

    if not sub_info:
        # No active subscription — send them to the marketing site to buy one.
        return render_template(
            "no_subscription.html",
            email=email,
            marketing_site_url=MARKETING_SITE_URL,
        ), 402

    # Sync local record with Stripe (create if first login, update if returning).
    existing = db.get_customer_by_email(email)
    if existing:
        customer_id = existing["id"]
        db.update_customer_plan(
            customer_id,
            plan=sub_info.get("tier_id") or "active",
            stripe_customer_id=sub_info.get("stripe_customer_id"),
        )
        token = db.refresh_session_token(customer_id)
    else:
        customer_id, token = db.create_customer(
            email,
            plan=sub_info.get("tier_id"),
            stripe_customer_id=sub_info.get("stripe_customer_id"),
        )

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
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
