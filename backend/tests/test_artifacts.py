"""Artifact, contract, and saved-metric integrity tests.

These tests pin the identities that the API must not silently drift from:
the shipped Random Forest, the isotonic calibrator, the feature order, and the
contract used by the frontend and backend.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestClassifier
from sklearn.isotonic import IsotonicRegression

from app.core.config import calibrator_path, features_path, model_path
from app.core.feature_contract import feature_order, load_contract
from app.ml.artifact_manifest import verify_artifacts
from app.ml.model_loader import is_lfs_pointer
from app.ml.preprocessing import build_training_frame

REPO_ROOT = Path(__file__).resolve().parents[2]
METRICS_PATH = REPO_ROOT / "Models" / "CardioAI_Clinical_Metrics.json"
DATA_PATH = REPO_ROOT / "Outputs" / "ML_READY_DATASET.csv"


@pytest.fixture(scope="module")
def model():
    return joblib.load(model_path)


@pytest.fixture(scope="module")
def calibrator():
    return joblib.load(calibrator_path)


def test_deployed_artifacts_are_real_files_not_lfs_pointers():
    for path in (model_path, calibrator_path, features_path):
        p = Path(path)
        assert p.is_file()
        assert p.stat().st_size > 100
        assert not is_lfs_pointer(path)
    assert Path(model_path).stat().st_size > 1_000_000


def test_deployment_model_is_not_git_lfs_tracked():
    attributes = (REPO_ROOT / ".gitattributes").read_text(encoding="utf-8")
    rules = [
        line.split()
        for line in attributes.splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    model_rules = [
        rule
        for rule in rules
        if rule and rule[0] == "Models/CardioAI_Clinical_Model.pkl"
    ]
    for rule in model_rules:
        assert "filter=lfs" not in rule[1:]


def test_model_identity_and_hyperparameters(model):
    assert isinstance(model, RandomForestClassifier)
    assert model.n_estimators == 500
    assert model.max_depth == 20
    assert model.class_weight == "balanced"
    assert model.random_state == 42
    assert model.n_features_in_ == 18
    assert list(model.classes_) == [0, 1]
    assert list(model.feature_names_in_) == feature_order()


def test_feature_pickle_matches_contract(model):
    legacy = joblib.load(features_path)
    if isinstance(legacy, dict):
        legacy = legacy.get("features", list(legacy.keys()))
    assert list(legacy) == feature_order()
    assert list(model.feature_names_in_) == list(legacy)


def test_calibrator_identity_and_usability(calibrator):
    assert isinstance(calibrator, IsotonicRegression)
    out = np.asarray(calibrator.predict([0.0, 0.5, 1.0]), dtype=float)
    assert out.shape == (3,)
    assert np.all(np.isfinite(out))
    assert np.all((out >= 0.0) & (out <= 1.0))
    assert np.all(np.diff(out) >= -1e-12)
    assert np.all(getattr(calibrator, "y_thresholds_", np.array([0.0])) >= 0.0)
    assert np.all(getattr(calibrator, "y_thresholds_", np.array([1.0])) <= 1.0)


def test_contract_shape_and_encoding():
    contract = load_contract()
    assert contract["feature_count"] == 18
    assert contract["feature_order"] == feature_order()
    assert contract["calibration"] == "isotonic"
    assert contract["risk_thresholds"] == {"low": 0.05, "high": 0.20}
    names = [f["name"] for f in contract["features"]]
    assert names == contract["feature_order"]
    assert len(set(names)) == 18
    fields = [f["field"] for f in contract["features"]]
    assert len(set(fields)) == 18


def test_contract_categorical_and_continuous_metadata():
    contract = load_contract()
    derived = [f for f in contract["features"] if f.get("derived")]
    assert [f["name"] for f in derived] == ["BMXBMI"]
    for feature in contract["features"]:
        if feature["type"] == "categorical":
            assert feature["options"]
            assert set(feature["encode"]) == set(feature["options"])
            assert sorted(feature["encode"].values()) == list(
                range(1, len(feature["options"]) + 1)
            )
            assert "min" not in feature and "max" not in feature
        else:
            assert feature["min"] <= feature["max"]
            assert feature.get("mean", feature["min"]) >= feature["min"]
            assert feature.get("mean", feature["max"]) <= feature["max"]


def test_contract_documents_adult_complete_case_limitations():
    contract = load_contract()
    age = next(f for f in contract["features"] if f["name"] == "RIDAGEYR")
    bmi = next(f for f in contract["features"] if f["name"] == "BMXBMI")
    smoking = next(f for f in contract["features"] if f["name"] == "SMQ040")
    assert contract["schema_version"] == "3.0.0"
    assert age["min"] == 18
    assert "18-80" in age["notes"]
    assert "same derivation" in bmi["notes"]
    assert "structural skip" in smoking["notes"]


def test_saved_metrics_are_consistent_with_artifacts(model):
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    assert metrics["feature_count"] == model.n_features_in_ == 18
    assert metrics["cohort_rows"] == 3501
    assert metrics["cohort_events"] == 392
    assert metrics["train_rows"] == 2800
    assert metrics["test_rows"] == 701
    assert metrics["test_events"] == 78
    assert metrics["seed"] == model.random_state == 42
    assert metrics["risk_thresholds"] == {"low": 0.05, "high": 0.2}
    for key in (
        "test_prevalence",
        "roc_auc",
        "brier_raw",
        "brier_calibrated",
        "log_loss_raw",
        "log_loss_calibrated",
        "high_risk_accuracy",
        "high_risk_f1",
        "high_risk_mcc",
    ):
        value = metrics[key]
        assert isinstance(value, (int, float))
        assert np.isfinite(value)
    assert 0.0 <= metrics["roc_auc"] <= 1.0
    assert metrics["brier_calibrated"] <= metrics["brier_raw"]
    assert metrics["log_loss_calibrated"] <= metrics["log_loss_raw"]
    assert metrics["uncertainty"]["iterations_valid"] > 0
    assert metrics["uncertainty"]["roc_auc_95_ci"][0] <= metrics["roc_auc"]
    assert metrics["uncertainty"]["roc_auc_95_ci"][1] >= metrics["roc_auc"]
    assert metrics["exclusions"]["eligible_rows"] == 3501
    assert metrics["exclusions"]["excluded_unknown_category"] == 6


def test_manifest_matches_default_artifacts():
    result = verify_artifacts(force=True)
    assert result["ok"], result["errors"]
    assert set(result["artifacts"]) == {
        "model",
        "calibrator",
        "features",
        "contract",
        "preprocessing",
        "metrics",
    }
    assert result["feature_count"] == 18


def test_hashed_json_artifacts_are_lf_normalized():
    manifest = json.loads(
        (REPO_ROOT / "Models" / "CardioAI_Clinical_Manifest.json").read_text(
            encoding="utf-8"
        )
    )
    paths = {
        "contract": REPO_ROOT / "feature_contract.json",
        "preprocessing": REPO_ROOT
        / "Models"
        / "CardioAI_Clinical_Preprocessing.json",
        "metrics": METRICS_PATH,
    }
    for role, path in paths.items():
        data = path.read_bytes()
        assert b"\r\n" not in data, f"{role} must use LF line endings"
        assert len(data) == manifest["files"][role]["bytes"]


def test_lf_checkout_rules_cover_hashed_json_artifacts():
    attributes = (REPO_ROOT / ".gitattributes").read_text(encoding="utf-8")
    rules = [
        line.split()
        for line in attributes.splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    required = {
        "feature_contract.json",
        "Models/CardioAI_Clinical_Preprocessing.json",
        "Models/CardioAI_Clinical_Metrics.json",
        "Models/CardioAI_Clinical_Manifest.json",
    }
    for path in required:
        matching = [rule for rule in rules if rule[0] == path]
        assert any("eol=lf" in rule[1:] for rule in matching), (
            f"{path} must be checked out with LF line endings"
        )


def test_contract_ranges_and_means_match_eligible_training_cohort():
    if not DATA_PATH.is_file():
        pytest.skip("source dataset is not available in this environment")
    X, _ = build_training_frame(pd.read_csv(DATA_PATH))
    contract = load_contract()
    for feature in contract["features"]:
        if feature["type"] != "continuous":
            continue
        values = X[feature["name"]]
        assert feature["min"] == pytest.approx(float(values.min()), abs=1e-9)
        assert feature["max"] == pytest.approx(float(values.max()), abs=1e-9)
        assert feature["mean"] == pytest.approx(float(values.mean()), abs=0.01)
