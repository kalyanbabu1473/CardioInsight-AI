"""Pytest fixtures for the CardioInsight backend.

Points the app at the exact production artifacts shipped in the Docker image
(the 18-feature clinical Random Forest, its isotonic calibrator, and the feature
contract) before any application module is imported, then exposes a
``TestClient`` for endpoint tests. No database is configured or required.
"""

import os
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"

sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault(
    "ML_MODEL_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Clinical_Model.pkl"),
)
os.environ.setdefault(
    "ML_CALIBRATOR_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Clinical_Calibrator.pkl"),
)
os.environ.setdefault(
    "ML_FEATURES_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Clinical_Features.pkl"),
)
os.environ.setdefault(
    "ML_CONTRACT_PATH",
    str(REPO_ROOT / "feature_contract.json"),
)
os.environ.setdefault(
    "ML_PREPROCESSING_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Clinical_Preprocessing.json"),
)
os.environ.setdefault(
    "ML_METRICS_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Clinical_Metrics.json"),
)
os.environ.setdefault(
    "ML_MANIFEST_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Clinical_Manifest.json"),
)

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
