"""SQLAlchemy models for the CardioInsight persistence layer."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


def _utcnow() -> datetime:
    """Timezone-aware UTC now (required for PostgreSQL timestamptz columns)."""
    return datetime.now(timezone.utc)


class Assessment(Base):
    """A completed cardiovascular risk assessment.

    The record stores the raw patient ``input`` and the ``result`` produced by
    the frontend risk engine (Random Forest). The backend never reinvents the
    prediction — it only persists what the client computed so reports can be
    re-rendered at any time and the full history is queryable.
    """

    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(
        String(24), primary_key=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, index=True
    )
    model: Mapped[str] = mapped_column(String(64))
    model_tagline: Mapped[str] = mapped_column(String(64))
    input: Mapped[dict[str, Any]] = mapped_column(JSON)
    result: Mapped[dict[str, Any]] = mapped_column(JSON)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<Assessment id={self.id!r} created_at={self.created_at.isoformat()!r} "
            f"model={self.model!r}>"
        )