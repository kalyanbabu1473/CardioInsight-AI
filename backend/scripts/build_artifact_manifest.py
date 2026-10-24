"""Build the SHA-256 manifest for the deployed CardioInsight artifacts.

Run after training, feature-contract generation, and frontend contract sync.

Run from the repository root:
    backend/.venv/Scripts/python backend/scripts/build_artifact_manifest.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.ml.artifact_manifest import write_manifest  # noqa: E402


def main() -> None:
    output = write_manifest()
    print("Manifest:", output)


if __name__ == "__main__":
    main()
