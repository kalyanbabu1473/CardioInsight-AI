"""Unit tests for model diagnostics (unavailability must never be silent)."""

from app.ml.model_loader import is_lfs_pointer, model_diagnostics, model_unavailable_reason


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
