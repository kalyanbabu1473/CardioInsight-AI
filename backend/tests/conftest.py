"""Pytest fixtures for the CardioInsight backend.

Points the app at the exact production model artifacts shipped in the Docker
image (the tracked 44-feature Random Forest
``Models/Random_Forest/Random_Forest_Model.pkl`` + the feature contract) before
any application module is imported, then exposes a ``TestClient`` for endpoint
tests. No database is configured or required.
"""

import os
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"

# Ensure the `app` package is importable regardless of the CWD.
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault(
    "ML_MODEL_PATH",
    str(REPO_ROOT / "Models" / "Random_Forest" / "Random_Forest_Model.pkl"),
)
os.environ.setdefault(
    "ML_FEATURES_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Assessment_Features.pkl"),
)
os.environ.setdefault(
    "ML_CONTRACT_PATH",
    str(REPO_ROOT / "feature_contract.json"),
)

# Prove the suite runs without any database configuration.
os.environ.pop("DATABASE_URL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.assessment_store import store  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _fresh_store():
    """Clear process-local history around each test for isolation."""
    store.clear()
    yield
    store.clear()
