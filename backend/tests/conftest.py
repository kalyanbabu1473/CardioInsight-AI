"""Pytest fixtures for the CardioInsight backend.

Points the app at a temporary SQLite database and the real production model
artifacts (the 43-feature research Random Forest + the feature contract) before
any application module is imported, then exposes a ``TestClient`` for endpoint
tests.
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"

# Ensure the `app` package is importable regardless of the CWD.
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault(
    "ML_MODEL_PATH",
    str(REPO_ROOT / "Models" / "Random_Forest_Model.pkl"),
)
os.environ.setdefault(
    "ML_FEATURES_PATH",
    str(REPO_ROOT / "Models" / "CardioAI_Assessment_Features.pkl"),
)
os.environ.setdefault(
    "ML_CONTRACT_PATH",
    str(REPO_ROOT / "feature_contract.json"),
)

_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()
os.environ["DATABASE_URL"] = "sqlite:///" + _tmp_db.name.replace("\\", "/")

from fastapi.testclient import TestClient  # noqa: E402

from app.database.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _fresh_tables():
    """Recreate schema for each test so assertions stay independent."""
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)