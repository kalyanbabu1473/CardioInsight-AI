"""Regression tests for deployment verifier configuration and path resolution."""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from app.core.config import (
    ArtifactConfigurationError,
    artifact_configuration,
)
from app.ml import model_loader
from app.ml.artifact_manifest import configured_paths

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "backend" / "scripts" / "verify_model.py"

ML_ENV_VARS = (
    "ML_MODEL_PATH",
    "ML_CALIBRATOR_PATH",
    "ML_FEATURES_PATH",
    "ML_CONTRACT_PATH",
    "ML_PREPROCESSING_PATH",
    "ML_METRICS_PATH",
    "ML_MANIFEST_PATH",
)

RELATIVE_CLINICAL_ENV = {
    "ML_MODEL_PATH": "Models/CardioAI_Clinical_Model.pkl",
    "ML_CALIBRATOR_PATH": "Models/CardioAI_Clinical_Calibrator.pkl",
    "ML_FEATURES_PATH": "Models/CardioAI_Clinical_Features.pkl",
    "ML_CONTRACT_PATH": "feature_contract.json",
    "ML_PREPROCESSING_PATH": "Models/CardioAI_Clinical_Preprocessing.json",
    "ML_METRICS_PATH": "Models/CardioAI_Clinical_Metrics.json",
    "ML_MANIFEST_PATH": "Models/CardioAI_Clinical_Manifest.json",
}


def _run_verifier(cwd: Path, extra_env: dict[str, str] | None = None):
    env = os.environ.copy()
    for name in ML_ENV_VARS:
        env.pop(name, None)
    env.update(extra_env or {})
    return subprocess.run(
        [sys.executable, str(SCRIPT)],
        cwd=cwd,
        env=env,
        text=True,
        capture_output=True,
        timeout=180,
        check=False,
    )


def _assert_passed(result: subprocess.CompletedProcess[str]) -> None:
    output = result.stdout + result.stderr
    assert result.returncode == 0, output
    assert "VERIFICATION PASSED" in result.stdout, output
    assert "[PASS] model order == contract order" in result.stdout, output


def test_verifier_and_production_loader_use_the_same_artifacts():
    configuration = artifact_configuration()
    paths = configured_paths()

    assert configuration["model"].path == paths.model
    assert configuration["calibrator"].path == paths.calibrator
    assert configuration["features"].path == paths.features
    assert configuration["contract"].path == paths.contract
    assert configuration["preprocessing"].path == paths.preprocessing
    assert configuration["metrics"].path == paths.metrics
    assert configuration["manifest"].path == paths.manifest

    assert Path(model_loader.model_path).resolve() == paths.model
    assert Path(model_loader.calibrator_path).resolve() == paths.calibrator
    assert Path(model_loader.features_path).resolve() == paths.features


def test_verifier_runs_from_repository_root():
    result = _run_verifier(REPO_ROOT)
    _assert_passed(result)
    assert f"repository root: {REPO_ROOT}" in result.stdout
    assert "source: default" in result.stdout


def test_verifier_runs_from_a_different_working_directory(tmp_path):
    result = _run_verifier(tmp_path)
    _assert_passed(result)
    assert f"repository root: {REPO_ROOT}" in result.stdout


def test_relative_overrides_resolve_from_repository_root(monkeypatch):
    for name, value in RELATIVE_CLINICAL_ENV.items():
        monkeypatch.setenv(name, value)

    configuration = artifact_configuration()
    assert configuration["model"].path == (
        REPO_ROOT / "Models" / "CardioAI_Clinical_Model.pkl"
    ).resolve()
    assert configuration["contract"].path == (
        REPO_ROOT / "feature_contract.json"
    ).resolve()
    assert all(
        item.source.startswith("ML_") for item in configuration.values()
    )


def test_stale_legacy_override_is_rejected(monkeypatch):
    monkeypatch.setenv(
        "ML_MODEL_PATH", "../Models/Random_Forest/Random_Forest_Model.pkl"
    )
    monkeypatch.setenv("ML_CONTRACT_PATH", "../feature_contract.json")

    with pytest.raises(ArtifactConfigurationError) as excinfo:
        artifact_configuration()

    message = str(excinfo.value)
    assert "ML_MODEL_PATH must reference 'CardioAI_Clinical_Model.pkl'" in message
    assert "Random_Forest_Model.pkl" in message
    assert "ML_CONTRACT_PATH is relative but resolves outside" in message


def test_verifier_fails_clearly_when_model_is_missing(tmp_path):
    missing = tmp_path / "CardioAI_Clinical_Model.pkl"
    result = _run_verifier(REPO_ROOT, {"ML_MODEL_PATH": str(missing)})

    output = result.stdout + result.stderr
    assert result.returncode != 0, output
    assert "[FAIL] model file exists - missing" in result.stdout, output
    assert "artifact model not found" in result.stdout, output


def test_verifier_fails_clearly_when_model_is_corrupted(tmp_path):
    corrupted = tmp_path / "CardioAI_Clinical_Model.pkl"
    corrupted.write_bytes(b"not a joblib model")
    result = _run_verifier(REPO_ROOT, {"ML_MODEL_PATH": str(corrupted)})

    output = result.stdout + result.stderr
    assert result.returncode != 0, output
    assert "[FAIL] model loads with joblib" in result.stdout, output
    assert "sha256 mismatch: model" in result.stdout, output


def test_verifier_fails_clearly_on_preprocessing_hash_mismatch(tmp_path):
    mismatch = tmp_path / "CardioAI_Clinical_Preprocessing.json"
    mismatch.write_text(
        json.dumps({"complete_case": True, "version": "tampered"}) + "\n",
        encoding="utf-8",
    )
    result = _run_verifier(
        REPO_ROOT, {"ML_PREPROCESSING_PATH": str(mismatch)}
    )

    output = result.stdout + result.stderr
    assert result.returncode != 0, output
    assert "sha256 mismatch: preprocessing" in result.stdout, output
    assert "size mismatch: preprocessing" in result.stdout, output
