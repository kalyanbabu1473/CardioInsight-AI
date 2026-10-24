"""SHA-256 integrity manifest for the deployed model artifacts.

The manifest pins the exact model, calibrator, feature pickle, feature contract,
preprocessing description, and saved metrics. The loader verifies the hashes
before serving predictions and fails closed when any file is missing, truncated,
or modified. This protects against accidental drift and partial deployments; it
is not a cryptographic signature and cannot stop an attacker with write access
to every artifact and the manifest.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

import joblib

from app.core.config import artifact_configuration

MANIFEST_SCHEMA_VERSION = "1.0.0"
ROLES = ("model", "calibrator", "features", "contract", "preprocessing", "metrics")


class ArtifactIntegrityError(RuntimeError):
    """Raised when the deployed artifacts do not match their manifest."""


@dataclass(frozen=True)
class ArtifactPaths:
    manifest: Path
    model: Path
    calibrator: Path
    features: Path
    contract: Path
    preprocessing: Path
    metrics: Path


def configured_paths() -> ArtifactPaths:
    configuration = artifact_configuration()
    return ArtifactPaths(
        manifest=configuration["manifest"].path,
        model=configuration["model"].path,
        calibrator=configuration["calibrator"].path,
        features=configuration["features"].path,
        contract=configuration["contract"].path,
        preprocessing=configuration["preprocessing"].path,
        metrics=configuration["metrics"].path,
    )


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _artifact_entries(paths: ArtifactPaths) -> dict[str, dict]:
    entries = {}
    for role in ROLES:
        path = getattr(paths, role)
        if not path.is_file():
            raise FileNotFoundError(f"artifact {role} not found: {path}")
        entries[role] = {"sha256": _sha256(path), "bytes": path.stat().st_size}
    return entries


def _feature_list(features_file: Path) -> list[str]:
    legacy = joblib.load(features_file)
    if isinstance(legacy, dict):
        legacy = legacy.get("features", list(legacy.keys()))
    return list(legacy)


def build_manifest(
    paths: ArtifactPaths | None = None,
    generated_at: str | None = None,
) -> dict:
    """Build a portable manifest from the currently configured artifacts."""
    paths = paths or configured_paths()
    contract = _read_json(paths.contract)
    metrics = _read_json(paths.metrics)
    preprocessing = _read_json(paths.preprocessing)
    feature_order = list(contract.get("feature_order", []))
    if len(feature_order) != 18:
        raise ValueError("Contract feature_order must contain 18 features.")
    if _feature_list(paths.features) != feature_order:
        raise ValueError("Features pickle does not match the contract feature order.")
    if int(metrics.get("feature_count", -1)) != len(feature_order):
        raise ValueError("Saved metrics feature_count does not match the contract.")

    return {
        "schema_version": MANIFEST_SCHEMA_VERSION,
        "generated_at": generated_at
        or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model_name": contract.get("model", "CardioAI_Clinical_Model.pkl"),
        "calibration": contract.get("calibration"),
        "risk_thresholds": contract.get("risk_thresholds"),
        "feature_count": len(feature_order),
        "feature_order": feature_order,
        "training": {
            "dataset_sha256": metrics.get("dataset_sha256"),
            "target": metrics.get("target"),
            "cohort_rows": metrics.get("cohort_rows"),
            "cohort_events": metrics.get("cohort_events"),
            "train_rows": metrics.get("train_rows"),
            "test_rows": metrics.get("test_rows"),
            "test_events": metrics.get("test_events"),
            "split": metrics.get("split"),
            "seed": metrics.get("seed"),
            "metrics_version": metrics.get("metrics_version"),
        },
        "preprocessing": {
            "version": preprocessing.get("version"),
            "shared_module": preprocessing.get("shared_module"),
            "age_range": preprocessing.get("age_range"),
            "complete_case": preprocessing.get("complete_case"),
            "bmi": preprocessing.get("bmi"),
            "smoking": preprocessing.get("smoking"),
        },
        "files": _artifact_entries(paths),
    }


def write_manifest(
    paths: ArtifactPaths | None = None,
    output: Path | None = None,
) -> Path:
    paths = paths or configured_paths()
    output = output or paths.manifest
    manifest = build_manifest(paths)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return output


def _verify(paths: ArtifactPaths) -> dict:
    result: dict = {
        "ok": False,
        "manifest_path": str(paths.manifest),
        "manifest_exists": paths.manifest.is_file(),
        "errors": [],
        "artifacts": {},
        "feature_count": None,
    }
    try:
        manifest = _read_json(paths.manifest)
    except Exception as exc:  # noqa: BLE001 - report, do not raise
        result["errors"].append(f"cannot read manifest: {type(exc).__name__}: {exc}")
        return result

    if manifest.get("schema_version") != MANIFEST_SCHEMA_VERSION:
        result["errors"].append(
            "unsupported manifest schema_version: %r"
            % (manifest.get("schema_version"),)
        )
    files = manifest.get("files")
    if not isinstance(files, dict):
        result["errors"].append("manifest.files is missing or invalid")
        return result

    for role in ROLES:
        path = getattr(paths, role)
        expected = files.get(role)
        if not isinstance(expected, dict):
            result["errors"].append(f"manifest is missing file entry: {role}")
            continue
        if not path.is_file():
            result["errors"].append(f"artifact {role} not found: {path}")
            continue
        actual_hash = _sha256(path)
        actual_bytes = path.stat().st_size
        result["artifacts"][role] = {
            "path": str(path),
            "bytes": actual_bytes,
            "sha256": actual_hash,
        }
        if not hmac.compare_digest(str(expected.get("sha256", "")), actual_hash):
            result["errors"].append(f"sha256 mismatch: {role}")
        if int(expected.get("bytes", -1)) != actual_bytes:
            result["errors"].append(f"size mismatch: {role}")

    try:
        contract = _read_json(paths.contract)
        contract_order = list(contract.get("feature_order", []))
        result["feature_count"] = len(contract_order)
        manifest_order = list(manifest.get("feature_order", []))
        if len(contract_order) != 18:
            result["errors"].append("contract feature_order does not contain 18 features")
        if manifest_order != contract_order:
            result["errors"].append("manifest feature_order does not match contract")
        if _feature_list(paths.features) != contract_order:
            result["errors"].append("features pickle does not match contract feature_order")
        metrics = _read_json(paths.metrics)
        if int(metrics.get("feature_count", -1)) != len(contract_order):
            result["errors"].append("saved metrics feature_count does not match contract")
        preprocessing = _read_json(paths.preprocessing)
        if preprocessing.get("complete_case") is not True:
            result["errors"].append("preprocessing manifest does not declare complete_case")
    except Exception as exc:  # noqa: BLE001 - report, do not raise
        result["errors"].append(
            f"artifact metadata validation failed: {type(exc).__name__}: {exc}"
        )

    result["ok"] = not result["errors"]
    return result


@lru_cache(maxsize=1)
def _verify_default_cached() -> dict:
    return _verify(configured_paths())


def verify_artifacts(
    paths: ArtifactPaths | None = None,
    *,
    force: bool = False,
) -> dict:
    """Verify artifact hashes and metadata.

    Default-path verification is cached for the process lifetime. Pass explicit
    paths (or ``force=True``) for tests or post-deployment diagnostics.
    """
    if paths is None and not force:
        return _verify_default_cached()
    return _verify(paths or configured_paths())


def clear_cache() -> None:
    _verify_default_cached.cache_clear()
