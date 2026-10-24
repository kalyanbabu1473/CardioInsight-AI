"""Artifact manifest verification and fail-closed loader tests."""

import shutil
from pathlib import Path

import pytest

import app.ml.model_loader as model_loader
from app.ml.artifact_manifest import (
    ArtifactIntegrityError,
    ArtifactPaths,
    build_manifest,
    configured_paths,
    verify_artifacts,
    write_manifest,
)


@pytest.fixture()
def copied_paths(tmp_path):
    source = configured_paths()
    target = ArtifactPaths(
        manifest=tmp_path / "manifest.json",
        model=tmp_path / "model.pkl",
        calibrator=tmp_path / "calibrator.pkl",
        features=tmp_path / "features.pkl",
        contract=tmp_path / "contract.json",
        preprocessing=tmp_path / "preprocessing.json",
        metrics=tmp_path / "metrics.json",
    )
    for role in ("model", "calibrator", "features", "contract", "preprocessing", "metrics"):
        shutil.copyfile(getattr(source, role), getattr(target, role))
    write_manifest(target)
    return target


def test_manifest_default_is_valid():
    result = verify_artifacts(force=True)
    assert result["ok"], result["errors"]
    assert result["manifest_exists"] is True
    assert result["feature_count"] == 18


def test_manifest_writer_uses_lf_line_endings(copied_paths):
    assert b"\r\n" not in copied_paths.manifest.read_bytes()


def test_manifest_build_is_deterministic_and_portable(copied_paths):
    first = build_manifest(copied_paths)
    second = build_manifest(copied_paths)
    assert first["files"] == second["files"]
    assert first["feature_order"] == second["feature_order"]
    assert first["training"]["cohort_rows"] == 3501
    assert set(first["files"]) == {
        "model",
        "calibrator",
        "features",
        "contract",
        "preprocessing",
        "metrics",
    }


def test_modified_model_is_rejected(copied_paths):
    with copied_paths.model.open("ab") as fh:
        fh.write(b"\x00")
    result = verify_artifacts(copied_paths)
    assert result["ok"] is False
    assert any("sha256 mismatch: model" in error for error in result["errors"])


def test_missing_artifact_is_rejected(copied_paths):
    copied_paths.contract.unlink()
    result = verify_artifacts(copied_paths)
    assert result["ok"] is False
    assert any("artifact contract not found" in error for error in result["errors"])


def test_preprocessing_must_be_complete_case(copied_paths):
    import json

    preprocessing = json.loads(
        copied_paths.preprocessing.read_text(encoding="utf-8")
    )
    preprocessing["complete_case"] = False
    copied_paths.preprocessing.write_text(
        json.dumps(preprocessing), encoding="utf-8"
    )
    write_manifest(copied_paths)
    result = verify_artifacts(copied_paths)
    assert result["ok"] is False
    assert any("complete_case" in error for error in result["errors"])


def test_reordered_contract_features_are_rejected(copied_paths):
    import json

    contract = json.loads(copied_paths.contract.read_text(encoding="utf-8"))
    contract["feature_order"] = list(reversed(contract["feature_order"]))
    copied_paths.contract.write_text(json.dumps(contract), encoding="utf-8")
    result = verify_artifacts(copied_paths)
    assert result["ok"] is False
    assert any("sha256 mismatch: contract" in error for error in result["errors"])


def test_loader_fails_closed_when_manifest_fails(monkeypatch):
    model_loader.load_model.cache_clear()
    model_loader.load_feature_names.cache_clear()
    monkeypatch.setattr(
        model_loader,
        "verify_artifacts",
        lambda: {"ok": False, "errors": ["tampered model"]},
    )
    with pytest.raises(ArtifactIntegrityError, match="tampered model"):
        model_loader.load_model()
    model_loader.load_model.cache_clear()
    model_loader.load_feature_names.cache_clear()
