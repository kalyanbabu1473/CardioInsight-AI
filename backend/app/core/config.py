"""Application configuration, driven by environment variables.

There is no database configuration: assessments are served from process-local
memory and the ML model artifacts are loaded directly from disk. No
``DATABASE_URL`` (or Supabase/PostgreSQL credential) is required.

ML model artifacts live in the repository ``Models/`` directory by default
(the tracked 44-feature production Random Forest
``Models/Random_Forest/Random_Forest_Model.pkl`` — the real training model —
plus the repo-root ``feature_contract.json`` contract). Paths resolve relative
to the repository root via this module's location, so they work regardless of
the process working directory (local dev, GitHub Actions, native Render).
Override with ``ML_MODEL_PATH`` / ``ML_CONTRACT_PATH`` (or the Docker image
variants) in production.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

PACKAGE_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_MODELS_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Load backend/.env into the environment (real env vars take precedence).
load_dotenv(PACKAGE_ROOT / ".env", override=False)

# --- Environment ------------------------------------------------------------
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

# --- Model artifacts --------------------------------------------------------
model_path = os.getenv(
    "ML_MODEL_PATH",
    str(DEFAULT_MODELS_DIR / "Models" / "Random_Forest" / "Random_Forest_Model.pkl"),
)
features_path = os.getenv(
    "ML_FEATURES_PATH",
    str(DEFAULT_MODELS_DIR / "Models" / "CardioAI_Assessment_Features.pkl"),
)

# Canonical feature contract (single source of truth, see app.core.feature_contract).
CONTRACT_PATH = os.getenv(
    "ML_CONTRACT_PATH",
    str(DEFAULT_MODELS_DIR / "feature_contract.json"),
)

# --- CORS --------------------------------------------------------------------
def _resolve_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    # Safe local-dev defaults plus the production frontend origin.
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cardioinsight-frontend.onrender.com",
    ]


ALLOWED_ORIGINS = _resolve_allowed_origins()

# --- Hosting -----------------------------------------------------------------
HOST: str = os.getenv("HOST", "127.0.0.1")
PORT: int = int(os.getenv("PORT", "8000"))
RELOAD: bool = os.getenv("RELOAD", "false").lower() in {"1", "true", "yes"}
