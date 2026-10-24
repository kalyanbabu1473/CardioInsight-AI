"""Unit tests for model diagnostics (unavailability must never be silent)."""

import logging

from fastapi.testclient import TestClient
from sklearn.isotonic import IsotonicRegression

from app.ml.model_loader import (
    _calibrator_smoke_error,
    is_lfs_pointer,
    model_diagnostics,
    model_ready,
    model_unavailable_reason,
)


def test_is_lfs_pointer_detects_pointer_stub(tmp_path):
    stub = tmp_path / "pointer.pkl"
    stub.write_bytes(b"version https://git-lfs.github.com/spec/v1\n")
    assert is_lfs_pointer(str(stub)) is True


def test_is_lfs_pointer_false_for_real_file(tmp_path):
    real = tmp_path / "real.bin"
    real.write_bytes(b"\x80\x04\x95" + b"0" * 1000)
    assert is_lfs_pointer(str(real)) is False


def test_model_diagnostics_reports_load_failure(tmp_path, monkeypatch):
    broken = tmp_path / "broken.pkl"
    broken.write_bytes(b"this is not a pickle")
    from app.ml import model_loader

    monkeypatch.setattr(model_loader, "model_path", str(broken))
    diag = model_diagnostics()
    assert diag["model_exists"] is True
    assert diag["is_lfs_pointer"] is False
    assert diag["load_error_type"] is not None
    assert diag["load_error_message"]


def test_model_unavailable_reason_ready_with_shipped_model(monkeypatch):
    from app.ml import model_loader
    from app.core.config import model_path as default_path

    monkeypatch.setattr(model_loader, "model_path", default_path)
    assert model_unavailable_reason() is None


def test_calibrator_smoke_rejects_objects_without_predict():
    assert _calibrator_smoke_error(object()) is not None


def test_calibrator_smoke_rejects_unfitted_isotonic():
    error = _calibrator_smoke_error(IsotonicRegression())
    assert error is not None


def test_calibrator_smoke_accepts_fitted_isotonic():
    calibrator = IsotonicRegression(out_of_bounds="clip").fit(
        [0.0, 0.2, 0.5, 0.8, 1.0],
        [0.0, 0.1, 0.3, 0.7, 1.0],
    )
    assert _calibrator_smoke_error(calibrator) is None


def test_diagnostics_expose_calibrator_smoke_and_model_metadata():
    diag = model_diagnostics()
    assert diag["loaded_model_type"] == "RandomForestClassifier"
    assert diag["has_predict_proba"] is True
    assert diag["model_classes"] == [0, 1]
    assert diag["calibrator_type"] == "IsotonicRegression"
    assert diag["calibrator_smoke_ok"] is True
    assert diag["calibrator_smoke_error"] is None
    assert diag["contract_order_match"] is True


def test_model_ready_is_false_for_unusable_calibrator(monkeypatch):
    from app.ml import model_loader

    monkeypatch.setattr(
        model_loader, "load_calibrator", lambda: IsotonicRegression()
    )
    assert model_ready() is False


def test_startup_logs_sanitized_model_readiness_failure(monkeypatch, caplog):
    import app.main as main

    reason = "sha256 mismatch: model; size mismatch: model"
    monkeypatch.setattr(main, "model_ready", lambda: False)
    monkeypatch.setattr(main, "model_unavailable_reason", lambda: reason)

    with caplog.at_level(logging.ERROR, logger="cardioinsight.startup"):
        with TestClient(main.app) as client:
            response = client.get("/api/health")

    assert response.status_code == 503
    messages = [
        record.getMessage()
        for record in caplog.records
        if record.name == "cardioinsight.startup"
    ]
    assert any(
        "ML model readiness failed at startup" in message
        and reason in message
        for message in messages
    )
