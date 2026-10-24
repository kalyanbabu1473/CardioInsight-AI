"""In-memory assessment store (no external database required).

CardioInsight AI no longer persists assessments to Supabase/PostgreSQL/SQLite.
The assessment API keeps the records produced during the lifetime of this
backend process so the existing frontend can create, list, and fetch reports.
Records are created only from server-side model output, never from a client
result.

This store is intentionally process-local and NOT durable: a restart clears the
history. A completed assessment is returned to the client immediately, so the
report and every download (Print, PDF, JSON, CSV) keep working for the current
assessment even after a restart.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from app.utils.assessment_ids import build_id, id_prefix


@dataclass(frozen=True)
class AssessmentRecord:
    """A completed cardiovascular risk assessment held in process memory."""

    id: str
    created_at: datetime
    model: str
    model_tagline: str
    input: dict[str, Any]
    result: dict[str, Any]


class InMemoryAssessmentStore:
    """Thread-safe, process-local assessment history."""

    def __init__(self) -> None:
        self._records: list[AssessmentRecord] = []
        self._lock = Lock()

    def create(
        self,
        *,
        model: str,
        model_tagline: str,
        input: dict[str, Any],
        result: dict[str, Any],
        created_at: datetime | None = None,
    ) -> AssessmentRecord:
        """Store a server-computed assessment and assign its sequential ID."""
        now = created_at or datetime.now(timezone.utc)
        with self._lock:
            prefix = id_prefix(now)
            sequence = (
                sum(1 for record in self._records if record.id.startswith(prefix)) + 1
            )
            record = AssessmentRecord(
                id=build_id(now, sequence),
                created_at=now,
                model=model,
                model_tagline=model_tagline,
                input=input,
                result=result,
            )
            self._records.append(record)
            return record

    def list(self) -> list[AssessmentRecord]:
        """Return every assessment, newest first."""
        with self._lock:
            return sorted(
                self._records, key=lambda record: record.created_at, reverse=True
            )

    def latest(self) -> AssessmentRecord | None:
        """Return the most recently stored assessment, if any."""
        records = self.list()
        return records[0] if records else None

    def get(self, assessment_id: str) -> AssessmentRecord | None:
        """Return a single assessment by ID."""
        with self._lock:
            return next(
                (
                    record
                    for record in self._records
                    if record.id == assessment_id
                ),
                None,
            )

    def clear(self) -> None:
        """Drop all records (used by tests; a restart has the same effect)."""
        with self._lock:
            self._records.clear()


store = InMemoryAssessmentStore()
