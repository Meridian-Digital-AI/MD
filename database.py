"""SQLite database for customer onboarding, submissions, and campaigns."""

import sqlite3
import uuid
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "ads_platform.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            session_token TEXT UNIQUE,
            stripe_customer_id TEXT,
            plan TEXT,
            subscription_status TEXT DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            business_name TEXT NOT NULL,
            industry TEXT NOT NULL,
            location TEXT NOT NULL,
            service_area TEXT NOT NULL,
            monthly_budget REAL NOT NULL,
            goal TEXT NOT NULL,
            usps TEXT NOT NULL,
            target_audience TEXT NOT NULL,
            website_url TEXT,
            phone_number TEXT,
            additional_context TEXT,
            platforms TEXT DEFAULT 'google_ads,meta_ads',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            submission_id INTEGER NOT NULL REFERENCES submissions(id),
            campaign_json TEXT,
            status TEXT DEFAULT 'generating',
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()

    # Migration: add platforms column to submissions if it doesn't exist
    sub_cols = {row[1] for row in conn.execute("PRAGMA table_info(submissions)").fetchall()}
    if "platforms" not in sub_cols:
        conn.execute("ALTER TABLE submissions ADD COLUMN platforms TEXT DEFAULT 'google_ads,meta_ads'")
        conn.commit()

    # Migration: add push columns if they don't exist
    existing = {row[1] for row in conn.execute("PRAGMA table_info(campaigns)").fetchall()}
    new_cols = {
        "google_push_status": "TEXT DEFAULT 'pending'",
        "google_campaign_id": "TEXT",
        "google_push_error": "TEXT",
        "meta_push_status": "TEXT DEFAULT 'pending'",
        "meta_campaign_id": "TEXT",
        "meta_push_error": "TEXT",
        "pushed_at": "TIMESTAMP",
    }
    for col, typedef in new_cols.items():
        if col not in existing:
            conn.execute(f"ALTER TABLE campaigns ADD COLUMN {col} {typedef}")
    conn.commit()
    conn.close()


def create_customer(email, plan=None, stripe_customer_id=None):
    """Create or refresh a customer record, returning (customer_id, session_token).

    If `plan` / `stripe_customer_id` are provided (e.g. after a Stripe lookup
    on the marketing site), they're stored so the dashboard can display the
    active tier without re-hitting Stripe on every page load.
    """
    conn = get_db()
    token = str(uuid.uuid4())
    email = (email or "").strip().lower()
    try:
        conn.execute(
            """INSERT INTO customers
               (email, session_token, plan, stripe_customer_id, subscription_status)
               VALUES (?, ?, ?, ?, ?)""",
            (
                email,
                token,
                plan,
                stripe_customer_id,
                "active" if plan else "none",
            ),
        )
        conn.commit()
        customer_id = conn.execute(
            "SELECT id FROM customers WHERE email = ?", (email,)
        ).fetchone()["id"]
    except sqlite3.IntegrityError:
        # Email already exists — refresh token and (optionally) update plan.
        if plan or stripe_customer_id:
            conn.execute(
                """UPDATE customers
                   SET session_token = ?,
                       plan = COALESCE(?, plan),
                       stripe_customer_id = COALESCE(?, stripe_customer_id),
                       subscription_status = 'active'
                   WHERE email = ?""",
                (token, plan, stripe_customer_id, email),
            )
        else:
            conn.execute(
                "UPDATE customers SET session_token = ? WHERE email = ?",
                (token, email),
            )
        conn.commit()
        customer_id = conn.execute(
            "SELECT id FROM customers WHERE email = ?", (email,)
        ).fetchone()["id"]
    conn.close()
    return customer_id, token


def get_customer_by_token(token):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM customers WHERE session_token = ?", (token,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def save_submission(customer_id, data):
    conn = get_db()
    conn.execute(
        """INSERT INTO submissions
        (customer_id, business_name, industry, location, service_area,
         monthly_budget, goal, usps, target_audience, website_url,
         phone_number, additional_context, platforms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            customer_id,
            data["business_name"],
            data["industry"],
            data["location"],
            data["service_area"],
            float(data["monthly_budget"]),
            data["goal"],
            json.dumps(data.get("usps", [])),
            data["target_audience"],
            data.get("website_url", ""),
            data.get("phone_number", ""),
            data.get("additional_context", ""),
            data.get("platforms", "google_ads,meta_ads"),
        ),
    )
    conn.commit()
    submission_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return submission_id


def get_submission(submission_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM submissions WHERE id = ?", (submission_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_latest_submission(customer_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM submissions WHERE customer_id = ? ORDER BY id DESC LIMIT 1",
        (customer_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def create_campaign(customer_id, submission_id):
    conn = get_db()
    conn.execute(
        "INSERT INTO campaigns (customer_id, submission_id) VALUES (?, ?)",
        (customer_id, submission_id),
    )
    conn.commit()
    campaign_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return campaign_id


def update_campaign(campaign_id, campaign_json=None, status=None, error_message=None):
    conn = get_db()
    if campaign_json is not None:
        conn.execute(
            "UPDATE campaigns SET campaign_json = ?, status = ? WHERE id = ?",
            (campaign_json, status or "ready", campaign_id),
        )
    elif status:
        conn.execute(
            "UPDATE campaigns SET status = ?, error_message = ? WHERE id = ?",
            (status, error_message, campaign_id),
        )
    conn.commit()
    conn.close()


def get_campaign(campaign_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM campaigns WHERE id = ?", (campaign_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_campaigns_by_customer(customer_id):
    """Return all campaigns for a customer with business name, newest first."""
    conn = get_db()
    rows = conn.execute(
        """SELECT c.id, c.status, c.error_message, c.created_at,
                  s.business_name, s.monthly_budget
           FROM campaigns c
           JOIN submissions s ON c.submission_id = s.id
           WHERE c.customer_id = ?
           ORDER BY c.id DESC""",
        (customer_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_customer_by_email(email):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM customers WHERE email = ?", (email,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def refresh_session_token(customer_id):
    """Generate a new session token for an existing customer (login)."""
    conn = get_db()
    token = str(uuid.uuid4())
    conn.execute(
        "UPDATE customers SET session_token = ? WHERE id = ?",
        (token, customer_id),
    )
    conn.commit()
    conn.close()
    return token


def update_push_status(campaign_id, platform, status, platform_campaign_id=None, error=None):
    """Update the push status for a specific platform (google or meta)."""
    conn = get_db()
    conn.execute(
        f"UPDATE campaigns SET {platform}_push_status = ?, {platform}_campaign_id = ?, "
        f"{platform}_push_error = ? WHERE id = ?",
        (status, platform_campaign_id, error, campaign_id),
    )
    conn.commit()
    conn.close()


def update_campaign_push_result(campaign_id, overall_status):
    """Update overall campaign status after push attempt."""
    conn = get_db()
    conn.execute(
        "UPDATE campaigns SET status = ?, pushed_at = CURRENT_TIMESTAMP WHERE id = ?",
        (overall_status, campaign_id),
    )
    conn.commit()
    conn.close()


def update_customer_plan(customer_id, plan, stripe_customer_id=None):
    conn = get_db()
    if stripe_customer_id:
        conn.execute(
            "UPDATE customers SET plan = ?, subscription_status = 'active', stripe_customer_id = ? WHERE id = ?",
            (plan, stripe_customer_id, customer_id),
        )
    else:
        conn.execute(
            "UPDATE customers SET plan = ?, subscription_status = 'active' WHERE id = ?",
            (plan, customer_id),
        )
    conn.commit()
    conn.close()
