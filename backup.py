"""Take a consistent backup of ads_platform.db.

Uses SQLite's online backup API (sqlite3 .backup()) so we get a point-in-time
snapshot even while Flask is running and writing. A plain `cp` of the .db
file would risk copying mid-write and producing a corrupt backup.

Usage:
    python backup.py                    # default: write to ./backups/
    python backup.py /path/to/dir       # custom output dir
    KEEP=14 python backup.py            # keep last 14 backups (default 7)

Cron example (nightly 02:30, keep 14 days):
    30 2 * * * cd /opt/ai-ads-builder && KEEP=14 /opt/ai-ads-builder/venv/bin/python backup.py >> backups/backup.log 2>&1
"""

from __future__ import annotations

import os
import sys
import sqlite3
import gzip
import shutil
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "ads_platform.db"


def backup(dest_dir: Path, keep: int = 7) -> Path:
    """Snapshot the DB into dest_dir, gzip it, and prune old ones."""
    if not DB_PATH.exists():
        raise SystemExit(f"Database not found at {DB_PATH} — nothing to back up.")

    dest_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    raw_path = dest_dir / f"ads_platform-{stamp}.db"
    gz_path = dest_dir / f"ads_platform-{stamp}.db.gz"

    # Online backup API — safe while the app is running.
    src = sqlite3.connect(str(DB_PATH))
    try:
        dst = sqlite3.connect(str(raw_path))
        try:
            with dst:
                src.backup(dst)
        finally:
            dst.close()
    finally:
        src.close()

    # Gzip to keep backup dir small; SQLite files compress ~4–10x.
    with open(raw_path, "rb") as f_in, gzip.open(gz_path, "wb", compresslevel=6) as f_out:
        shutil.copyfileobj(f_in, f_out)
    raw_path.unlink()

    # Prune: keep only the newest `keep` snapshots.
    snapshots = sorted(
        dest_dir.glob("ads_platform-*.db.gz"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    for old in snapshots[keep:]:
        try:
            old.unlink()
        except OSError as e:
            print(f"warn: could not delete {old.name}: {e}")

    size_kb = gz_path.stat().st_size / 1024
    print(
        f"[{datetime.utcnow().isoformat(timespec='seconds')}Z] "
        f"backup ok -> {gz_path.name} ({size_kb:.1f} KB); "
        f"{min(len(snapshots) + 1, keep)} kept"
    )
    return gz_path


if __name__ == "__main__":
    out_arg = sys.argv[1] if len(sys.argv) > 1 else None
    dest = Path(out_arg).expanduser().resolve() if out_arg else (HERE / "backups")
    keep = int(os.environ.get("KEEP", "7"))
    backup(dest, keep=keep)
