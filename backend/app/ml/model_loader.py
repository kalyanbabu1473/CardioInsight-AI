"""Model loading utilities for the CardioInsight production model.

Loads the joblib-serialized 18-feature clinical RandomForestClassifier and its
isotonic probability calibrator. The authoritative feature ordering always comes
from the model itself (``feature_names_in_``); the feature contract is validated
against it at load time.

Unavailability is never silent: ``model_diagnostics`` and ``model_ready``
produce safe, loggable detail (exception type/message, path, size, Git-LFS
pointer flag, contract-vs-model feature diff) so production logs reveal the
exact cause instead of a bare ``False``.
"""

import logging
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np

from app.core.config import calibrator_path, features_path, model_path
from app.core.feature_contract import (
    FeatureContractError,
    feature_order,
    validate_against_model,
)
from app.ml.artifact_manifest import ArtifactIntegrityError, verify_artifacts

logger = logging.getLogger("cardioinsight.ml.model_loader")

_LFS_POINTER_MARKER = b"version https://git-lfs.github.com/spec/v1"
_last_failure_key: tuple[str, str] | None = None


@lru_cache(maxsize=1)
def load_model():
    """Load and cache the production RandomForest model.

    The artifact manifest is checked first; a missing or modified model,
    calibrator, contract, features, preprocessing description, or metrics file
    fails closed rather than serving predictions from drifted artifacts.
    """
    integrity = verify_artifacts()
    if not integrity["ok"]:
        raise ArtifactIntegrityError(
            "Artifact integrity check failed: " + "; ".join(integrity["errors"])
        )
    model = joblib.load(model_path)
    validate_against_model(model)
    return model


def _calibrator_smoke_error(calibrator: object) -> str | None:
    """Return a reason string when the calibrator is not fitted/usable."""
    if not hasattr(calibrator, "predict"):
        return "artifact does not expose predict()"
    try:
        out = np.asarray(calibrator.predict([0.0, 0.5, 1.0]), dtype=float).reshape(-1)
    except Exception as exc:  # noqa: BLE001 - reporting, not raising
        return f"{type(exc).__name__}: {exc}"
    if out.shape != (3,):
        return f"predict() returned shape {out.shape}, expected (3,)"
    if not np.all(np.isfinite(out)):
        return "predict() returned a non-finite value"
    if np.any(out < 0.0) or np.any(out > 1.0):
        return "predict() returned a probability outside [0, 1]"
    return None


@lru_cache(maxsize=1)
def load_calibrator():
    """Load and cache the isotonic probability calibrator."""
    calibrator = joblib.load(calibrator_path)
    smoke_error = _calibrator_smoke_error(calibrator)
    if smoke_error:
        raise TypeError(
            "Calibrator artifact is not usable (%s): %s"
            % (type(calibrator).__name__, smoke_error)
        )
    return calibrator


@lru_cache(maxsize=1)
def load_feature_names():
    """Return the exact ordered feature list the model expects.

    The model's ``feature_names_in_`` is authoritative. The legacy pickle
    fallback only applies to old deployment artifacts that lack the attribute.
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
    """Safe snapshot of why the model may be unavailable (no secrets/env vars)."""
    path = Path(model_path)
    cal_path = Path(calibrator_path)
    diag: dict = {
        "model_path": model_path,
        "model_exists": path.is_file(),
        "model_size_bytes": path.stat().st_size if path.is_file() else None,
        "is_lfs_pointer": is_lfs_pointer(model_path),
        "calibrator_path": calibrator_path,
        "calibrator_exists": cal_path.is_file(),
        "calibrator_size_bytes": cal_path.stat().st_size if cal_path.is_file() else None,
        "calibrator_lfs_pointer": is_lfs_pointer(calibrator_path),
        "calibrator_type": None,
        "calibrator_smoke_ok": None,
        "calibrator_smoke_error": None,
        "calibrator_error_type": None,
        "calibrator_error_message": None,
        "load_error_type": None,
        "load_error_message": None,
        "loaded_model_type": None,
        "has_predict_proba": None,
        "model_classes": None,
        "n_features_model": None,
        "n_features_contract": None,
        "contract_order_match": None,
        "missing_features": [],
        "extra_features": [],
        "manifest_path": None,
        "manifest_exists": None,
        "manifest_ok": None,
        "manifest_errors": [],
        "manifest_artifacts": {},
    }
    try:
        integrity = verify_artifacts()
        diag["manifest_path"] = integrity["manifest_path"]
        diag["manifest_exists"] = integrity["manifest_exists"]
        diag["manifest_ok"] = integrity["ok"]
        diag["manifest_errors"] = list(integrity["errors"])
        diag["manifest_artifacts"] = integrity["artifacts"]
    except Exception as exc:  # noqa: BLE001 - reporting, not raising
        diag["manifest_ok"] = False
        diag["manifest_errors"] = [f"{type(exc).__name__}: {exc}"]
    if diag["manifest_ok"] is False:
        return diag
    try:
        model = joblib.load(path)
    except Exception as exc:  # noqa: BLE001 - reporting, not raising
        diag["load_error_type"] = type(exc).__name__
        diag["load_error_message"] = str(exc)
        return diag

    diag["loaded_model_type"] = type(model).__name__
    diag["has_predict_proba"] = callable(getattr(model, "predict_proba", None))
    diag["model_classes"] = [
        int(value) for value in getattr(model, "classes_", [])
    ]
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

    try:
        calibrator = joblib.load(cal_path)
        diag["calibrator_type"] = type(calibrator).__name__
        smoke_error = _calibrator_smoke_error(calibrator)
        diag["calibrator_smoke_ok"] = smoke_error is None
        diag["calibrator_smoke_error"] = smoke_error
    except Exception as exc:  # noqa: BLE001 - reporting, not raising
        diag["calibrator_error_type"] = type(exc).__name__
        diag["calibrator_error_message"] = str(exc)
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
        "missing_features=%s extra_features=%s manifest_ok=%s "
        "manifest_errors=%s calibrator_exists=%s "
        "calibrator_smoke_error=%s calibrator_error=%s",
        type(exc).__name__,
        exc,
        diag["model_path"],
        diag["model_exists"],
        diag["model_size_bytes"],
        diag["is_lfs_pointer"],
        diag["contract_order_match"],
        diag["missing_features"],
        diag["extra_features"],
        diag["manifest_ok"],
        diag["manifest_errors"],
        diag["calibrator_exists"],
        diag["calibrator_smoke_error"],
        diag["calibrator_error_message"],
    )


def model_unavailable_reason() -> str | None:
    """Human-readable reason the model is unavailable (safe; no secrets)."""
    diag = model_diagnostics()
    if diag["manifest_ok"] is False:
        errors = "; ".join(diag["manifest_errors"]) or "unknown manifest error"
        return f"artifact integrity check failed: {errors}"
    if diag["load_error_type"]:
        return f"{diag['load_error_type']}: {diag['load_error_message']}"
    if diag["is_lfs_pointer"]:
        return "model file is a Git LFS pointer (content not downloaded)"
    if not diag["calibrator_exists"]:
        return f"calibrator not found: {diag['calibrator_path']}"
    if diag["calibrator_lfs_pointer"]:
        return "calibrator file is a Git LFS pointer (content not downloaded)"
    if diag["calibrator_error_type"]:
        return (
            f"calibrator load failed: {diag['calibrator_error_type']}: "
            f"{diag['calibrator_error_message']}"
        )
    if diag["calibrator_smoke_ok"] is False:
        return f"calibrator is not usable: {diag['calibrator_smoke_error']}"
    if not diag["contract_order_match"]:
        missing = ", ".join(diag["missing_features"])
        extra = ", ".join(diag["extra_features"])
        return (
            f"model/contract feature mismatch (missing: {missing}; extra: {extra})"
        )
    return None


def model_ready() -> bool:
    """Best-effort check that artifacts, model, calibrator, and features load."""
    try:
        integrity = verify_artifacts()
        if not integrity["ok"]:
            raise ArtifactIntegrityError("; ".join(integrity["errors"]))
        m = load_model()
        cal = load_calibrator()
        f = load_feature_names()
        return (
            int(getattr(m, "n_features_in_", -1)) == len(f)
            and callable(getattr(m, "predict_proba", None))
            and 1 in list(getattr(m, "classes_", []))
            and _calibrator_smoke_error(cal) is None
        )
    except (ArtifactIntegrityError, FeatureContractError) as exc:
        _log_failure(exc)
        return False
    except Exception as exc:  # noqa: BLE001 - defensive
        _log_failure(exc)
        return False
