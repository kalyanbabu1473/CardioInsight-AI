"""Assessment ID generation.

IDs follow the ``CI-YYYYMMDD-XXXX`` format, sequential per calendar day and
unique globally, e.g. ``CI-20260808-0001``. The backend is the sole authority
for IDs — they are never generated client-side.
"""

from datetime import datetime, timezone


def id_prefix(now: datetime) -> str:
    """Date-stamped prefix shared by every ID created on the same day."""
    return f"CI-{now.strftime('%Y%m%d')}-"


def build_id(now: datetime, sequence: int) -> str:
    """Builds a padded sequential ID for a given day and sequence number."""
    return f"{id_prefix(now)}{sequence:04d}"


def current_id_prefix(now: datetime | None = None) -> str:
    return id_prefix(now or datetime.now(timezone.utc))