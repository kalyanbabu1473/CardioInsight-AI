"""Build-time / deployment-time verification of the production ML artifact.

Runs inside the Docker build (after the model, calibrator, and contract are
copied) and can be run locally. It fails loudly with a non-zero exit code if an
artifact is missing, a Git LFS pointer stub, unloadable, not the expected type,
does not exactly match the 18-feature contract, or does not match the SHA-256
artifact manifest.

Usage:
    python backend/scripts/verify_model.py
"""

import os
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parent.parent.parent
_BACKEND = _REPO / "backend"
_APP = Path("/app")
for _candidate in (_BACKEND, _APP, _REPO):
    if (_candidate / "app").is_dir():
        sys.path.insert(0, str(_candidate))
        break

import joblib  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from sklearn.ensemble import RandomForestClassifier  # noqa: E402
from sklearn.isotonic import IsotonicRegression  # noqa: E402

from app.core.config import CONTRACT_PATH, calibrator_path, model_path  # noqa: E402
from app.core.feature_contract import feature_order, load_contract  # noqa: E402
from app.ml.artifact_manifest import verify_artifacts  # noqa: E402

EXPECTED_FEATURE_COUNT = 18
MIN_PLAUSIBLE_SIZE_BYTES = 10 * 1024 * 1024
LFS_POINTER_MARKER = b"version https://git-lfs.github.com/spec/v1"

failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}" + (f" - {detail}" if detail else ""))
    if not ok:
        failures.append(name)


def is_lfs_pointer(path: Path) -> bool:
    with open(path, "rb") as fh:
        return fh.read(len(LFS_POINTER_MARKER)) == LFS_POINTER_MARKER


def _representative_row(contract: dict) -> list[float]:
    by_name = {f["name"]: f for f in contract["features"]}
    row = []
    for name in feature_order():
        spec = by_name[name]
        if spec.get("encode"):
            row.append(float(next(iter(spec["encode"].values()))))
        else:
            row.append(float(spec.get("mean", (spec["min"] + spec["max"]) / 2)))
    return row


def main() -> int:
    path = Path(model_path)
    cal_path = Path(calibrator_path)
    print(f"model path:      {model_path}")
    print(f"calibrator path: {calibrator_path}")
    print(f"contract path:   {CONTRACT_PATH}")

    integrity = verify_artifacts(force=True)
    check(
        "artifact manifest verifies",
        integrity["ok"],
        "; ".join(integrity["errors"]) if integrity["errors"] else str(integrity["manifest_path"]),
    )

    check("model file exists", path.is_file(), str(path) if path.is_file() else "missing")
    if not path.is_file():
        return _finish()

    size = path.stat().st_size
    check("model file is a real artifact (not LFS pointer)", not is_lfs_pointer(path))
    check(
        "model file has a plausible size",
        size >= MIN_PLAUSIBLE_SIZE_BYTES,
        f"{size / (1024 * 1024):.1f} MB",
    )

    try:
        model = joblib.load(path)
    except Exception as exc:  # noqa: BLE001 - report and fail the build
        check("model loads with joblib", False, f"{type(exc).__name__}: {exc}")
        return _finish()
    check("model loads with joblib", True)

    check(
        "model is a RandomForestClassifier",
        isinstance(model, RandomForestClassifier),
        type(model).__name__,
    )
    n_in = int(getattr(model, "n_features_in_", -1))
    check(f"model n_features_in_ == {EXPECTED_FEATURE_COUNT}", n_in == EXPECTED_FEATURE_COUNT, str(n_in))

    names = list(getattr(model, "feature_names_in_", []))
    check(
        f"model feature_names_in_ has {EXPECTED_FEATURE_COUNT} names",
        len(names) == EXPECTED_FEATURE_COUNT,
        str(len(names)),
    )

    try:
        contract = load_contract()
        contract_order = feature_order()
        check(
            f"contract defines {EXPECTED_FEATURE_COUNT} features",
            len(contract_order) == EXPECTED_FEATURE_COUNT,
            str(len(contract_order)),
        )
    except Exception as exc:  # noqa: BLE001
        check("contract loads", False, f"{type(exc).__name__}: {exc}")
        return _finish()

    match = names == contract_order
    check("model order == contract order", match)
    if not match:
        missing = [f for f in contract_order if f not in names]
        extra = [f for f in names if f not in contract_order]
        print(f"    contract features missing from model: {missing}")
        print(f"    model features absent from contract: {extra}")

    classes = getattr(model, "classes_", None)
    target_ok = list(classes) == [0, 1] if classes is not None else False
    check("model targets Composite_CVD (classes 0/1)", target_ok, str(classes))

    check("calibrator file exists", cal_path.is_file(), str(cal_path) if cal_path.is_file() else "missing")
    if cal_path.is_file():
        cal_size = cal_path.stat().st_size
        check("calibrator file is a real artifact (not LFS pointer)", not is_lfs_pointer(cal_path))
        check("calibrator file is non-empty", cal_size > 0, f"{cal_size} bytes")
        try:
            calibrator = joblib.load(cal_path)
        except Exception as exc:  # noqa: BLE001
            check("calibrator loads with joblib", False, f"{type(exc).__name__}: {exc}")
            calibrator = None
        else:
            check("calibrator loads with joblib", True)
        if calibrator is not None:
            check(
                "calibrator is an IsotonicRegression",
                isinstance(calibrator, IsotonicRegression),
                type(calibrator).__name__,
            )
            check("calibrator exposes predict()", hasattr(calibrator, "predict"))
            if hasattr(calibrator, "predict") and names == contract_order:
                row = _representative_row(contract)
                frame = pd.DataFrame([row], columns=names)
                raw = model.predict_proba(frame)[0]
                positive = float(raw[list(model.classes_).index(1)])
                calibrated = float(np.asarray(calibrator.predict([positive])).reshape(-1)[0])
                check(
                    "calibrated smoke prediction is finite and in [0, 1]",
                    np.isfinite(calibrated) and 0.0 <= calibrated <= 1.0,
                    f"raw={positive:.4f} calibrated={calibrated:.4f}",
                )

    return _finish()


def _finish() -> int:
    if failures:
        print(f"\nVERIFICATION FAILED ({len(failures)} check(s)): {', '.join(failures)}")
        return 1
    print("\nVERIFICATION PASSED - model artifacts match the manifest and feature contract.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
