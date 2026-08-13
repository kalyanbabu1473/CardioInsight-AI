"""One-time migration: SQLite -> PostgreSQL (CardioInsight backend).

Reads every existing assessment from the legacy SQLite file and copies it into
the PostgreSQL database configured by DATABASE_URL, preserving each record's ID,
created_at timestamp, model, model_tagline, input and result JSON verbatim.

Idempotent per-row: rows whose CI-... ID already exists in PostgreSQL are
skipped, so the script can be re-run safely.

Usage (from backend/):
    .venv\\Scripts\\python -m scripts.migrate_sqlite_to_postgresql
    .venv\\Scripts\\python -m scripts.migrate_sqlite_to_postgresql --sqlite path/to/cardioinsight.db
"""

import argparse
import json
import logging
import sqlite3
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.config import DATABASE_URL, DEFAULT_DATABASE_PATH
from app.database.session import Base, engine, SessionLocal
from app.models.assessment import Assessment

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("migrate")


def _parse_created(value: str) -> datetime:
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sqlite",
        default=str(DEFAULT_DATABASE_PATH),
        help="Path to the legacy SQLite database file.",
    )
    args = parser.parse_args()

    logger.info("Destination DATABASE_URL: %s", DATABASE_URL.split("@")[-1])

    src = sqlite3.connect(args.sqlite)
    src.row_factory = sqlite3.Row
    try:
        rows = src.execute(
            "SELECT id, created_at, model, model_tagline, input, result "
            "FROM assessments ORDER BY created_at"
        ).fetchall()
    finally:
        src.close()

    sqlite_count = len(rows)
    logger.info("SQLite assessment count: %d", sqlite_count)
    if sqlite_count == 0:
        logger.info("Nothing to migrate.")
        return

    Base.metadata.create_all(bind=engine)

    inserted, skipped = 0, 0
    with SessionLocal() as db:
        existing_ids = set(db.scalars(select(Assessment.id)).all())
        for row in rows:
            if row["id"] in existing_ids:
                skipped += 1
                continue
            stmt = insert(Assessment).values(
                id=row["id"],
                created_at=_parse_created(row["created_at"]),
                model=row["model"],
                model_tagline=row["model_tagline"],
                input=json.loads(row["input"]) if isinstance(row["input"], str) else row["input"],
                result=json.loads(row["result"]) if isinstance(row["result"], str) else row["result"],
            )
            db.execute(stmt)
            inserted += 1
        db.commit()

    logger.info("Inserted: %d  Already present (skipped): %d", inserted, skipped)

    with SessionLocal() as db:
        pg_ids = db.scalars(select(Assessment.id).order_by(Assessment.created_at)).all()

    pg_count = len(pg_ids)
    print("PostgreSQL assessment count:", pg_count)
    if pg_count == sqlite_count:
        print("OK — counts match.")
    else:
        print("WARNING — counts differ (sqlite=%d, postgres=%d)." % (sqlite_count, pg_count))

    logger.info("Verified IDs in PostgreSQL:")
    for i in pg_ids:
        logger.info("  %s", i)


if __name__ == "__main__":
    main()