"""Build-time / deployment-time verification of the production ML artifact.

Runs inside the Docker build (after the model + contract are copied) and can be
run locally. It fails loudly with a non-zero exit code if the model file at
``ML_MODEL_PATH`` is missing, a Git LFS pointer stub, unloadable, not a
``RandomForestClassifier``, or does not exactly match the 44-feature contract —
so a broken artifact can never ship a silently-unavailable prediction service.

Usage:
    python backend/scripts/verify_model.py
"""

import os
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parent.parent.parent
_BACKEND = _REPO / "backend"
_APP = Path("/app")  # Docker WORKDIR
for _candidate in (_BACKEND, _APP, _REPO):
    if (_candidate / "app").is_dir():
        sys.path.insert(0, str(_candidate))
        break

import joblib  # noqa: E402
from sklearn.ensemble import RandomForestClassifier  # noqa: E402

from app.core.config import CONTRACT_PATH, model_path  # noqa: E402
from app.core.feature_contract import feature_order  # noqa: E402

EXPECTED_FEATURE_COUNT = 44
MIN_PLAUSIBLE_SIZE_BYTES = 10 * 1024 * 1024  # a real model is ~82 MB, a pointer ~300 B
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


def main() -> int:
    path = Path(model_path)
    print(f"model path:      {model_path}")
    print(f"contract path:   {CONTRACT_PATH}")

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

    check("model is a RandomForestClassifier", isinstance(model, RandomForestClassifier),
          type(model).__name__)
    n_in = int(getattr(model, "n_features_in_", -1))
    check("model n_features_in_ == 44", n_in == EXPECTED_FEATURE_COUNT, str(n_in))

    names = list(getattr(model, "feature_names_in_", []))
    check("model feature_names_in_ has 44 names", len(names) == EXPECTED_FEATURE_COUNT,
          str(len(names)))

    try:
        contract_order = feature_order()
        check("contract defines 44 features", len(contract_order) == EXPECTED_FEATURE_COUNT,
              str(len(contract_order)))
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

    return _finish()


def _finish() -> int:
    if failures:
        print(f"\nVERIFICATION FAILED ({len(failures)} check(s)): {', '.join(failures)}")
        return 1
    print("\nVERIFICATION PASSED - model artifact matches the feature contract.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
