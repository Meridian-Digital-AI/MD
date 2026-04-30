"""One-off helper: get a Google Ads API refresh token.

HOW TO USE
──────────
You only run this ONCE per Google account. It prints a refresh token that
you paste into `.env` as GOOGLE_ADS_REFRESH_TOKEN. After that, the app uses
that refresh token forever to mint short-lived access tokens automatically.

Before running this, you need:
  1. A Google Cloud Console project with the "Google Ads API" enabled:
       https://console.cloud.google.com/apis/library/googleads.googleapis.com
  2. An OAuth 2.0 Client ID of type "Desktop app":
       APIs & Services → Credentials → + CREATE CREDENTIALS
                                      → OAuth client ID → Desktop app
       Name it "Meridian Ads Builder - local" or similar.
     Download the JSON or copy the Client ID + Client Secret.
  3. Your OAuth consent screen configured (User Type: External, add your
     own email as a test user so Google lets you through). The scopes
     tab only needs `https://www.googleapis.com/auth/adwords`.

Then run this from the project root:

    pip install google-auth-oauthlib
    python scripts/get_google_refresh_token.py

It'll open a browser, you'll sign in with the Google account that owns
the MCC, click Allow, and the refresh token prints to the terminal.

Copy the printed value into `.env` as:
    GOOGLE_ADS_REFRESH_TOKEN=1//0g...

That's it — you never need to run this again unless you revoke access or
change Google accounts.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Load .env from the project root so the script picks up the Client ID +
# Secret we already saved there. python-dotenv is in requirements.txt.
try:
    from dotenv import load_dotenv
    _project_root = Path(__file__).resolve().parent.parent
    load_dotenv(_project_root / ".env")
except ImportError:
    pass  # script can still work if the user set env vars manually

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    sys.stderr.write(
        "Missing dependency. Install with:\n    pip install google-auth-oauthlib\n"
    )
    sys.exit(1)

# The Google Ads API only needs this one scope — it's separate from other
# Google scopes (YouTube, Gmail, etc.) so there's no risk of over-granting.
SCOPES = ["https://www.googleapis.com/auth/adwords"]


def main() -> int:
    # Read the OAuth client details. We support two input styles so you
    # can paste OR point at the JSON Google gives you — whichever is handier.
    client_id = os.environ.get("GOOGLE_ADS_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GOOGLE_ADS_CLIENT_SECRET", "").strip()
    client_json = os.environ.get("GOOGLE_ADS_CLIENT_JSON", "").strip()

    if client_json:
        json_path = Path(client_json).expanduser()
        if not json_path.exists():
            print(f"GOOGLE_ADS_CLIENT_JSON points at {json_path} but it's not there.")
            return 1
        flow = InstalledAppFlow.from_client_secrets_file(str(json_path), SCOPES)
    elif client_id and client_secret:
        flow = InstalledAppFlow.from_client_config(
            {
                "installed": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": ["http://localhost"],
                }
            },
            SCOPES,
        )
    else:
        print(
            "I need your OAuth client credentials. Either:\n"
            "  export GOOGLE_ADS_CLIENT_ID=... GOOGLE_ADS_CLIENT_SECRET=...\n"
            "OR\n"
            "  export GOOGLE_ADS_CLIENT_JSON=/path/to/client_secret.json\n"
            "…and run this again."
        )
        return 1

    # This opens a browser, lets you pick your Google account, and swaps
    # the authorization code for tokens. port=0 picks a free port so we
    # don't clash with Flask on 5001.
    print("Opening browser to complete OAuth consent…")
    creds = flow.run_local_server(
        port=0,
        prompt="consent",  # force consent so a refresh_token comes back
        access_type="offline",
    )

    if not creds.refresh_token:
        print(
            "No refresh token returned. This usually means you've already\n"
            "consented for this client before and Google is re-using the\n"
            "previous grant. Fix: revoke access at\n"
            "    https://myaccount.google.com/permissions\n"
            "find the 'Meridian Ads Builder' app, remove it, and run this\n"
            "script again."
        )
        return 1

    print()
    print("─" * 60)
    print("Copy this into .env:")
    print("─" * 60)
    print(f"GOOGLE_ADS_REFRESH_TOKEN={creds.refresh_token}")
    print("─" * 60)
    print()
    print("Don't commit .env. Don't share the refresh token.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
