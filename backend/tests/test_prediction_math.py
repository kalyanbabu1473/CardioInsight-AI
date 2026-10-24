"""Direct numerical verification of the deployed prediction path.

These tests reconstruct the raw forest probability and the isotonic mapping
independently of the endpoint, then compare them with the API response. They
also pin the SHAP additivity identity and the "calibrator applied exactly once"
property.
"""

import math

import numpy as np
import pandas as pd
import pytest

from app.ml.feature_mapper import to_model_row
from app.ml.model_loader import load_calibrator, load_model
from app.ml.prediction_service import (
    FEATURE_ORDER,
    _calibrate,
    _confidence,
    _risk_level,
    _shap_attribution,
    predict,
)
from app.schemas.prediction import PredictRequest
from tests.test_predict import VALID_INPUT


def _input():
    return PredictRequest.model_validate({"input": VALID_INPUT}).input


def _raw_probability(row):
    model = load_model()
    frame = pd.DataFrame([row], columns=FEATURE_ORDER)
    proba = model.predict_proba(frame)[0]
    return float(proba[list(model.classes_).index(1)])


def test_direct_model_and_calibrator_match_api(client):
    input_ = _input()
    row = to_model_row(input_)
    raw = _raw_probability(row)
    calibrated = _calibrate(raw)
    response = client.post("/api/predict", json={"input": VALID_INPUT}).json()

    assert response["probability_raw"] == round(raw, 4)
    assert response["probability"] == round(calibrated, 4)
    assert response["level"] == _risk_level(calibrated)
    assert response["confidence"] == _confidence(calibrated)
    assert response["calibration"] == "isotonic"
    assert response["feature_values"] == [round(float(v), 4) for v in row]
    assert response["feature_names"] == FEATURE_ORDER


def test_calibrator_is_applied_exactly_once(client):
    input_ = _input()
    raw = _raw_probability(to_model_row(input_))
    once = _calibrate(raw)
    twice = _calibrate(once)
    response = client.post("/api/predict", json={"input": VALID_INPUT}).json()

    assert once != raw
    assert twice != once
    assert response["probability"] == round(once, 4)
    assert response["probability"] != round(twice, 4)


def test_shap_additivity_is_exact_at_service_level():
    row = to_model_row(_input())
    raw = _raw_probability(row)
    expected, contributions = _shap_attribution(row)
    restored = expected + sum(c.contribution for c in contributions)
    assert len(contributions) == 18
    assert len({c.feature for c in contributions}) == 18
    assert abs(restored - raw) < 1e-9
    assert all(math.isfinite(c.contribution) for c in contributions)
    magnitudes = [abs(c.contribution) for c in contributions]
    assert magnitudes == sorted(magnitudes, reverse=True)


def test_shap_explains_raw_not_calibrated_probability(client):
    row = to_model_row(_input())
    raw = _raw_probability(row)
    calibrated = _calibrate(raw)
    expected, contributions = _shap_attribution(row)
    restored = expected + sum(c.contribution for c in contributions)
    assert abs(restored - raw) < 1e-9
    assert abs(restored - calibrated) > 1e-4


def test_api_shap_identity_respects_rounding(client):
    body = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    restored = body["expected_value"] + sum(
        c["contribution"] for c in body["contributions"]
    )
    assert abs(restored - body["probability_raw"]) < 2e-4


def test_shap_is_input_specific_and_deterministic():
    first = predict(_input())
    second = predict(_input())
    assert [c.contribution for c in first.contributions] == [
        c.contribution for c in second.contributions
    ]

    changed_input = PredictRequest.model_validate(
        {
            "input": {
                **VALID_INPUT,
                "demographics": {"age": 72, "sex": "Male"},
                "bloodPressure": {
                    **VALID_INPUT["bloodPressure"],
                    "systolicBP": 178,
                },
            }
        }
    ).input
    changed = predict(changed_input)
    assert [c.contribution for c in changed.contributions] != [
        c.contribution for c in first.contributions
    ]


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), -0.01, 1.01])
def test_calibrate_rejects_invalid_raw_probability(bad):
    with pytest.raises(ValueError):
        _calibrate(bad)


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), -0.01, 1.01])
def test_risk_level_rejects_invalid_probability(bad):
    with pytest.raises(ValueError):
        _risk_level(bad)


def test_calibrator_rejects_bad_raw_probability_without_crashing_model():
    with pytest.raises(ValueError):
        _calibrate(float("nan"))
    assert load_calibrator() is not None
