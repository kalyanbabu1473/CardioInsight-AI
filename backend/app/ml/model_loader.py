"""Model loading utilities for the CardioInsight production model.

Loads the joblib-serialized RandomForestClassifier used for production
predictions (the 44-feature research model ``Random_Forest_Model.pkl``). The
model artefact path is configurable via Model config and defaults to values
inside the repository ``Models`` dir. The authoritative feature ordering always
comes from the model itself (``feature_names_in_``); the feature contract is
validated against it at load time.
"""

from functools import lru_cache

import joblib

from app.core.config import features_path, model_path
from app.core.feature_contract import FeatureContractError, validate_against_model

from app.core.feature_contract import load_contract  # noqa: F401  (re-export)


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


def model_ready() -> bool:
    """Best-effort check that the model and feature list load correctly."""
    try:
        m = load_model()
        f = load_feature_names()
        return int(getattr(m, "n_features_in_", -1)) == len(f)
    except FeatureContractError:
        return False
    except Exception:  # pragma: no cover - defensive
        return False