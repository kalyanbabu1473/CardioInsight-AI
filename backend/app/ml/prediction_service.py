"""Prediction service — runs the production model and returns a safe answer.

The service owns risk categorization (thresholds from notebook 13), the
confidence definition, and sanitization so routers never leak stack traces or
filesystem details to clients.

The feature vector is built strictly from the feature contract (44 features, the
model's exact training order). No imputation, no defaults, no fabricated
values — if any feature is absent the schema rejects the request before this
service runs.

For each prediction the service also computes exact per-feature TreeSHAP values
(``shap.TreeExplainer`` on the deployed ensemble) so the clinical report shows
real model attribution, not a heuristic approximation.
"""

import logging
from functools import lru_cache

import numpy as np
import pandas as pd
import shap

from app.core.feature_contract import feature_order, load_contract
from app.ml.feature_mapper import to_model_row
from app.ml.model_loader import load_feature_names, load_model
from app.schemas.prediction import (
    AssessmentInput,
    FeatureContribution,
    PredictionResponse,
)

logger = logging.getLogger("cardioinsight.ml")

# Display name for the deployed model (the real research consensus model).
MODEL_NAME = "Random Forest (Composite CVD — 44 features)"

FEATURE_ORDER = feature_order()
_SPECS = {f["name"]: f for f in load_contract()["features"]}


@lru_cache(maxsize=1)
def _explainer():
    """Cached TreeExplainer built from the deployed ensemble.

    TreeSHAP is exact for tree ensembles and needs no background dataset, so the
    contributions below are the authoritative per-feature attributions of the
    production model itself.
    """
    return shap.TreeExplainer(load_model())


def _confidence(prob: float) -> float:
    """Confidence in the prediction toward the positive class.

    Uses the model's returned probability distance from 0.5 scaled to 0-1: the
    farther the ensemble probability is from an even split, the more confident
    the prediction.
    """
    return float(round(abs(prob - 0.5) * 2, 4))


def _risk_level(prob: float) -> str:
    """Risk category thresholds replicate notebook 13 risk_category()."""
    if prob < 0.30:
        return "Low"
    if prob < 0.70:
        return "Moderate"
    return "High"


def _shap_attribution(
    row: list[float],
) -> tuple[float, list[FeatureContribution]]:
    """Exact TreeSHAP attribution for a single patient vector.

    Returns the model's expected value (log-odds baseline) plus a contribution
    for every feature, sorted by absolute impact. Values are log-odds-space
    attributions for the positive (CVD) class.
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
            "(contract=%d, model=%d features)." % (len(FEATURE_ORDER), len(model_feature_names))
        )

    row = to_model_row(input_)
    frame = pd.DataFrame([row], columns=FEATURE_ORDER)

    model = load_model()
    proba = model.predict_proba(frame)[0]
    positive_index = int(list(model.classes_).index(1))
    prob = float(proba[positive_index])

    expected_value, contributions = _shap_attribution(row)

    return PredictionResponse(
        model=MODEL_NAME,
        probability=round(prob, 4),
        level=_risk_level(prob),
        confidence=_confidence(prob),
        feature_names=FEATURE_ORDER,
        feature_values=[round(float(v), 4) for v in row],
        expected_value=round(expected_value, 4),
        contributions=contributions,
    )