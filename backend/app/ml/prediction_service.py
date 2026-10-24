"""Prediction service - runs the production model and returns a safe answer.

The service owns risk categorization, the confidence definition, and
sanitization so routers never leak stack traces or filesystem details to
clients.

The feature vector is built strictly from the feature contract (18 clinical
features, the model's exact training order). No imputation, no defaults, no
fabricated values - if any feature is absent the schema rejects the request
before this service runs.

The deployed Random Forest's raw probability is calibrated with an isotonic
regressor fitted on out-of-fold training predictions. Rounded calibrated
probabilities drive the reported risk level and confidence. TreeSHAP values
explain the underlying forest score, so the raw probability is returned
alongside the calibrated one for transparency.
"""

import logging
import math
from functools import lru_cache

import numpy as np
import pandas as pd
import shap

from app.core.feature_contract import (
    calibration_method,
    feature_order,
    load_contract,
    risk_thresholds,
)
from app.ml.feature_mapper import to_model_row
from app.ml.model_loader import load_calibrator, load_feature_names, load_model
from app.schemas.prediction import (
    AssessmentInput,
    FeatureContribution,
    PredictionResponse,
)

logger = logging.getLogger("cardioinsight.ml")

MODEL_NAME = "Random Forest (Clinical CVD - 18 features)"

FEATURE_ORDER = feature_order()
_SPECS = {f["name"]: f for f in load_contract()["features"]}


@lru_cache(maxsize=1)
def _explainer():
    """Cached TreeExplainer built from the deployed ensemble."""
    return shap.TreeExplainer(load_model())


def _calibrate(raw_prob: float) -> float:
    """Map a raw forest probability through the fitted isotonic calibrator."""
    if not math.isfinite(raw_prob) or not 0.0 <= raw_prob <= 1.0:
        raise ValueError("Raw model probability is not finite or in [0, 1].")
    calibrated = np.asarray(load_calibrator().predict([raw_prob])).reshape(-1)[0]
    calibrated = float(np.clip(calibrated, 0.0, 1.0))
    if not math.isfinite(calibrated) or not 0.0 <= calibrated <= 1.0:
        raise ValueError("Calibrator returned a non-finite or out-of-range value.")
    return calibrated


def _confidence(prob: float) -> float:
    """Prediction certainty as a percentage.

    For calibrated CVD probability ``p`` this is ``max(p, 1 - p) * 100``: a
    0.08 CVD probability means 92% certainty in the assigned binary outcome.
    It is the maximum calibrated class probability, not the probability that
    the prediction is correct and not a measure of diagnostic accuracy.
    """
    return float(round(max(prob, 1.0 - prob) * 100.0, 2))


def _risk_level(prob: float) -> str:
    """Map calibrated probability to the contract's Low/Moderate/High bands."""
    if not math.isfinite(prob) or not 0.0 <= prob <= 1.0:
        raise ValueError("Calibrated probability is not finite or in [0, 1].")
    low, high = risk_thresholds()
    if prob < low:
        return "Low"
    if prob < high:
        return "Moderate"
    return "High"


def _shap_attribution(
    row: list[float],
) -> tuple[float, list[FeatureContribution]]:
    """Exact TreeSHAP attribution for a single patient vector.

    Returns the model's expected value plus a contribution for every feature,
    sorted by absolute impact. These explain the forest's raw output, which is
    returned separately as ``probability_raw``.
    """
    explainer = _explainer()
    frame = pd.DataFrame([row], columns=FEATURE_ORDER)
    arr = np.asarray(explainer.shap_values(frame))
    if arr.ndim == 3 and arr.shape[-1] == 2:
        positive = arr[0, :, 1]
    elif arr.ndim == 2:
        positive = arr[0]
    else:
        positive = np.asarray(arr[1] if isinstance(arr, list) else arr)[0]
    expected_arr = np.asarray(explainer.expected_value)
    expected = float(expected_arr[1] if expected_arr.ndim > 0 else expected_arr)

    contributions = []
    for name, value, sh in zip(FEATURE_ORDER, row, positive):
        contributions.append(
            FeatureContribution(
                feature=name,
                label=_SPECS[name]["label"],
                value=float(value),
                contribution=float(sh),
            )
        )
    contributions.sort(key=lambda c: abs(c.contribution), reverse=True)
    return float(expected), contributions


def predict(input_: AssessmentInput) -> PredictionResponse:
    """Run inference for a validated assessment and return a structured result."""
    model_feature_names = load_feature_names()
    if model_feature_names != FEATURE_ORDER:
        raise ValueError(
            "Model feature order differs from the feature contract "
            "(contract=%d, model=%d features)."
            % (len(FEATURE_ORDER), len(model_feature_names))
        )

    row = to_model_row(input_)
    frame = pd.DataFrame([row], columns=FEATURE_ORDER)

    model = load_model()
    proba = model.predict_proba(frame)[0]
    classes = list(model.classes_)
    if 1 not in classes:
        raise ValueError("Model does not expose a positive CVD class.")
    positive_index = int(classes.index(1))
    raw_prob = float(proba[positive_index])
    if not math.isfinite(raw_prob) or not 0.0 <= raw_prob <= 1.0:
        raise ValueError("Raw model probability is not finite or in [0, 1].")
    prob = _calibrate(raw_prob)

    expected_value, contributions = _shap_attribution(row)

    return PredictionResponse(
        model=MODEL_NAME,
        probability=round(prob, 4),
        probability_raw=round(raw_prob, 4),
        level=_risk_level(prob),
        confidence=_confidence(prob),
        calibration=calibration_method(),
        feature_names=FEATURE_ORDER,
        feature_values=[round(float(v), 4) for v in row],
        expected_value=round(expected_value, 4),
        contributions=contributions,
    )
