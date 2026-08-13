"""Model loading utilities for the CardioInsight production model.

Loads the joblib-serialized RandomForestClassifier used for production
predictions (the 44-feature research model ``Random_Forest_Model.pkl``). The
model artefact path is configurable via Model config and defaults to values
inside the repository ``Models`` dir. The authoritative feature ordering always
comes from the model itself (``feature_names_in_``); the feature contract is
validated against it at load time.

Unavailability is never silent: ``model_diagnostics`` and ``model_ready``
produce safe, loggable detail (exception type/message, path, size, Git-LFS
pointer flag, contract-vs-model feature diff) so production logs reveal the
exact cause instead of a bare ``False``.
"""

import logging
from functools import lru_cache
from pathlib import Path

import joblib

from app.core.config import features_path, model_path
from app.core.feature_contract import (
    FeatureContractError,
    feature_order,
    validate_against_model,
)

logger = logging.getLogger("cardioinsight.ml.model_loader")

_LFS_POINTER_MARKER = b"version https://git-lfs.github.com/spec/v1"
_last_failure_key: tuple[str, str] | None = None


@lru_cache(maxsize=1)
def load_model():
    """Load and cache the production RandomForest model."""
    model = joblib.load(model_path)
    validate_against_model(model)
    return model


@lru_cache(maxsize=1)
def load_feature_names():
    """Return the exact ordered feature list the model expects.

    The model's ``feature_names_in_`` is authoritative (it was fitted on the
    44 consensus features). The legacy pickle fallback only applies to old
    deployment artifacts that lack the attribute.
    """
    names = getattr(load_model(), "feature_names_in_", None)
    if names is not None:
        return list(names)
    legacy = joblib.load(features_path)
    if isinstance(legacy, dict):
        legacy = legacy.get("features", list(legacy.keys()))
    return list(legacy)


def is_lfs_pointer(path: str) -> bool:
    """True when the file is an undownloaded Git LFS pointer stub."""
    try:
        with open(path, "rb") as fh:
            return fh.read(len(_LFS_POINTER_MARKER)) == _LFS_POINTER_MARKER
    except OSError:
        return False


def model_diagnostics() -> dict:
    """Safe snapshot of why the model may be unavailable (no secrets/env vars).

    Loads the model fresh each call so it reflects the current filesystem
    state; only called on failure paths or by the status endpoint.
    """
    path = Path(model_path)
    diag: dict = {
        "model_path": model_path,
        "model_exists": path.is_file(),
        "model_size_bytes": path.stat().st_size if path.is_file() else None,
        "is_lfs_pointer": is_lfs_pointer(model_path),
        "load_error_type": None,
        "load_error_message": None,
        "loaded_model_type": None,
        "n_features_model": None,
        "n_features_contract": None,
        "contract_order_match": None,
        "missing_features": [],
        "extra_features": [],
    }
    try:
        model = joblib.load(path)
    except Exception as exc:  # noqa: BLE001 - reporting, not raising
        diag["load_error_type"] = type(exc).__name__
        diag["load_error_message"] = str(exc)
        return diag

    diag["loaded_model_type"] = type(model).__name__
    diag["n_features_model"] = int(getattr(model, "n_features_in_", -1))
    actual = list(getattr(model, "feature_names_in_", []))
    try:
        expected = feature_order()
        diag["n_features_contract"] = len(expected)
        diag["contract_order_match"] = actual == expected
        if actual != expected:
            diag["missing_features"] = [f for f in expected if f not in actual]
            diag["extra_features"] = [f for f in actual if f not in expected]
    except FeatureContractError as exc:
        diag["load_error_type"] = "FeatureContractError"
        diag["load_error_message"] = str(exc)
    return diag


def _log_failure(exc: Exception) -> None:
    """Log a full diagnostic once per distinct failure to avoid log spam."""
    global _last_failure_key
    key = (type(exc).__name__, str(exc))
    if key == _last_failure_key:
        return
    _last_failure_key = key
    diag = model_diagnostics()
    logger.error(
        "ML model unavailable. type=%s message=%s path=%s exists=%s "
        "size_bytes=%s lfs_pointer=%s contract_order_match=%s "
        "missing_features=%s extra_features=%s",
        type(exc).__name__,
        exc,
        diag["model_path"],
        diag["model_exists"],
        diag["model_size_bytes"],
        diag["is_lfs_pointer"],
        diag["contract_order_match"],
        diag["missing_features"],
        diag["extra_features"],
    )


def model_unavailable_reason() -> str | None:
    """Human-readable reason the model is unavailable (safe; no secrets)."""
    diag = model_diagnostics()
    if diag["load_error_type"]:
        return f"{diag['load_error_type']}: {diag['load_error_message']}"
    if diag["is_lfs_pointer"]:
        return "model file is a Git LFS pointer (content not downloaded)"
    if not diag["contract_order_match"]:
        missing = ", ".join(diag["missing_features"])
        extra = ", ".join(diag["extra_features"])
        return (
            f"model/contract feature mismatch (missing: {missing}; extra: {extra})"
        )
    return None


def model_ready() -> bool:
    """Best-effort check that the model and feature list load correctly."""
    try:
        m = load_model()
        f = load_feature_names()
        return int(getattr(m, "n_features_in_", -1)) == len(f)
    except FeatureContractError as exc:
        _log_failure(exc)
        return False
    except Exception as exc:  # noqa: BLE001 - defensive
        _log_failure(exc)
        return False
