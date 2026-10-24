"""Application configuration, driven by environment variables.

There is no database configuration: assessments are served from process-local
memory and the ML model artifacts are loaded directly from disk. No
``DATABASE_URL`` (or Supabase/PostgreSQL credential) is required.

ML model artifacts live in the repository ``Models/`` directory by default
(the 18-feature clinical Random Forest
``Models/CardioAI_Clinical_Model.pkl``, its isotonic calibrator, and the
repo-root ``feature_contract.json`` contract). Paths resolve relative to the
repository root via this module's location, so they work regardless of the
process working directory (local dev, GitHub Actions, native Render).

Environment overrides are supported for container/volume deployments, but they
must reference the canonical clinical artifact names. Relative override paths
are resolved from the repository root, never from the current working
directory. Stale legacy overrides (for example a Random Forest research model)
fail configuration validation instead of silently changing the served model.
"""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

PACKAGE_ROOT = Path(__file__).resolve().parents[2]
_REPO_CANDIDATE = PACKAGE_ROOT.parent
# Native repo: backend/app/core -> repository root. Docker image: /app/app/core
# -> /app, where Models/ and feature_contract.json are copied.
REPO_ROOT = (
    PACKAGE_ROOT
    if (PACKAGE_ROOT / "feature_contract.json").is_file()
    else _REPO_CANDIDATE
)
BACKEND_ROOT = PACKAGE_ROOT

# Load backend/.env into the environment (real env vars take precedence).
load_dotenv(BACKEND_ROOT / ".env", override=False)

# --- Environment ------------------------------------------------------------
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")


class ArtifactConfigurationError(ValueError):
    """Raised when an ML artifact override is stale or inconsistent."""


@dataclass(frozen=True)
class ArtifactPathConfig:
    """Resolved path plus the source of its configuration."""

    role: str
    env_var: str
    path: Path
    source: str


ARTIFACT_SPECS: tuple[tuple[str, str, Path], ...] = (
    ("model", "ML_MODEL_PATH", Path("Models") / "CardioAI_Clinical_Model.pkl"),
    (
        "calibrator",
        "ML_CALIBRATOR_PATH",
        Path("Models") / "CardioAI_Clinical_Calibrator.pkl",
    ),
    (
        "features",
        "ML_FEATURES_PATH",
        Path("Models") / "CardioAI_Clinical_Features.pkl",
    ),
    (
        "contract",
        "ML_CONTRACT_PATH",
        Path("feature_contract.json"),
    ),
    (
        "preprocessing",
        "ML_PREPROCESSING_PATH",
        Path("Models") / "CardioAI_Clinical_Preprocessing.json",
    ),
    (
        "metrics",
        "ML_METRICS_PATH",
        Path("Models") / "CardioAI_Clinical_Metrics.json",
    ),
    (
        "manifest",
        "ML_MANIFEST_PATH",
        Path("Models") / "CardioAI_Clinical_Manifest.json",
    ),
)

_SPEC_BY_ROLE = {role: (env_var, default) for role, env_var, default in ARTIFACT_SPECS}


def _candidate(
    env_var: str,
    relative_default: Path,
) -> tuple[Path, str, bool]:
    """Return ``(candidate, source, is_relative_override)``.

    Relative override values are joined to the repository root rather than the
    process working directory. Defaults are also anchored at the repository
    root.
    """
    raw = os.getenv(env_var, "").strip()
    if not raw:
        return REPO_ROOT / relative_default, "default", False

    provided = Path(raw).expanduser()
    if provided.is_absolute():
        return provided, env_var, False
    return REPO_ROOT / provided, env_var, True


def _is_within_repository(path: Path) -> bool:
    try:
        path.relative_to(REPO_ROOT)
    except ValueError:
        return False
    return True


def _path_value(env_var: str, relative_default: Path) -> str:
    """Best-effort import-time value; full validation is lazy."""
    candidate, _, _ = _candidate(env_var, relative_default)
    return str(candidate.resolve())


def artifact_configuration() -> dict[str, ArtifactPathConfig]:
    """Resolve and validate the one canonical set of production artifacts.

    Validation deliberately rejects non-clinical artifact names and relative
    overrides that escape the repository root. It does not check file existence
    or hashes; those fail-closed checks remain in ``artifact_manifest`` and
    ``verify_model.py``.
    """
    configuration: dict[str, ArtifactPathConfig] = {}
    errors: list[str] = []

    for role, env_var, relative_default in ARTIFACT_SPECS:
        candidate, source, is_relative_override = _candidate(
            env_var, relative_default
        )
        resolved = candidate.resolve()

        expected_value = relative_default.as_posix()
        if candidate.name != relative_default.name:
            errors.append(
                f"{env_var} must reference {relative_default.name!r}; "
                f"got {candidate.name!r} ({resolved}); expected "
                f"repository-relative value: {expected_value!r}"
            )
        if is_relative_override and not _is_within_repository(resolved):
            errors.append(
                f"{env_var} is relative but resolves outside the repository root: "
                f"{resolved}; use {expected_value!r} or remove the variable"
            )

        configuration[role] = ArtifactPathConfig(
            role=role,
            env_var=env_var,
            path=resolved,
            source=source,
        )

    if errors:
        raise ArtifactConfigurationError("; ".join(errors))
    return configuration


model_path = _path_value(*_SPEC_BY_ROLE["model"])
calibrator_path = _path_value(*_SPEC_BY_ROLE["calibrator"])
features_path = _path_value(*_SPEC_BY_ROLE["features"])
CONTRACT_PATH = _path_value(*_SPEC_BY_ROLE["contract"])
PREPROCESSING_PATH = _path_value(*_SPEC_BY_ROLE["preprocessing"])
METRICS_PATH = _path_value(*_SPEC_BY_ROLE["metrics"])
MANIFEST_PATH = _path_value(*_SPEC_BY_ROLE["manifest"])

# Lower-case aliases match the older model/calibrator/features naming style.
preprocessing_path = PREPROCESSING_PATH
metrics_path = METRICS_PATH
manifest_path = MANIFEST_PATH


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
