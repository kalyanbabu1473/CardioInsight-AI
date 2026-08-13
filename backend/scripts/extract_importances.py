"""Extract real global feature importances from the deployed model.

Writes `frontend/src/features/reports/featureImportance.generated.ts`, the
ImportanceRow array used by the ReportViewer's "Feature Importance" chart,
so the report reflects the actual Random Forest rather than a placeholder.

Run from the backend directory:
    python scripts/extract_importances.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[2]
BACKEND = REPO / "backend"
CONTRACT = REPO / "feature_contract.json"
OUT = REPO / "frontend/src/features/reports/featureImportance.generated.ts"

TOP_N = 15


def main() -> None:
    sys.path.insert(0, str(BACKEND))
    from app.ml.model_loader import load_model

    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    by_name = {f["name"]: f for f in contract["features"]}

    model = load_model()
    importances = np.asarray(model.feature_importances_)
    names = list(model.feature_names_in_)

    picked = []
    for idx in np.argsort(importances)[::-1][:TOP_N]:
        code = names[idx]
        spec = by_name.get(code)
        if not spec:
            continue
        picked.append(
            (code, spec.get("label", code), float(importances[idx]),
             spec.get("notes", ""), spec.get("domain", ""))
        )

    top_share = sum(row[2] for row in picked)
    lines = [
        '/// <reference types="vite/client" />',
        "",
        "/*",
        " * GENERATED FILE — do not edit by hand. Real global feature importances",
        " * (Gini importance on the deployed forest) extracted from the model.",
        " * Regenerate with scripts/extract_importances.py.",
        " */",
        "",
        "export interface ImportanceRow {",
        "  name: string;",
        "  importance: number;",
        "  description: string;",
        "  note: string;",
        "}",
        "",
        "export const featureImportance: ImportanceRow[] = [",
    ]
    for code, label, imp, notes, domain in sorted(
        picked, key=lambda r: -r[2]
    ):
        name = f"{code} — {label}"
        note = f"Share of total model importance: {imp * 100:.1f}%."
        description = (
            notes.replace("\\", "\\\\").replace('"', '\\"')
            or f"Model feature {code} ({domain})."
        )
        lines.extend(
            [
                "  {",
                f'    name: "{name}",',
                f"    importance: {imp:.4f},",
                f'    description: "{description}",',
                f'    note: "{note}",',
                "  },",
            ]
        )
    lines.append("];")
    lines.append("")
    lines.append(f"export const importanceTopShare = {top_share:.4f};")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT} ({len(picked)} rows, top-share {top_share:.4f})")
    return 0


if __name__ == "__main__":
    sys.exit(main())