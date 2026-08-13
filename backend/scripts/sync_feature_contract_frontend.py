"""Generate frontend/src/data/assessment/featureContract.generated.ts from feature_contract.json.

Single source of truth is feature_contract.json at the repository root.
Run: python scripts/sync_feature_contract_frontend.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACT = ROOT / "feature_contract.json"
OUT = ROOT / "frontend" / "src" / "data" / "assessment" / "featureContract.generated.ts"


def to_ts_value(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float):
        return repr(value)
    if isinstance(value, int):
        return str(value)
    if isinstance(value, str):
        return json.dumps(value)
    raise TypeError(type(value))


def build() -> str:
    data = json.loads(CONTRACT.read_text(encoding="utf-8"))

    lines = [
        "// GENERATED FILE - do not edit by hand.",
        "// Source: feature_contract.json at the repository root.",
        "// Regenerate: python backend/scripts/sync_feature_contract_frontend.py",
        "",
        "export type CategoryKey =",
        *[f'  | "{key}"' for key in data["categories"]],
        "",
        "export interface FeatureSpec {",
        "  name: string;",
        '  /** Dot-path into AssessmentInput where this feature value lives. */',
        "  field: string;",
        "  label: string;",
        "  unit: string;",
        "  domain: string;",
        "  category: CategoryKey;",
        "  notes: string;",
        "  required: boolean;",
        "  type: 'continuous' | 'categorical';",
        "  min?: number;",
        "  max?: number;",
        "  /** Dataset average for continuous features (suggested typical value). */",
        "  mean?: number;",
        "  /** Sample group within a step (e.g. 'blood' / 'urine' for toxins). */",
        "  subgroup?: string;",
        "  options?: readonly string[];",
        '  encode?: Record<string, number>;',
        "  derived?: boolean;",
        '  /** Optional display override (e.g. waist shown in inches, stored in cm). */',
        "  display?: { unit: string; factor: number };",
        "}",
        "",
        "export const SCHEMA_VERSION: string =",
        f"  {json.dumps(data['schema_version'])};",
        "",
        "export const MODEL_FILE: string =",
        f"  {json.dumps(data['model'])};",
        "",
        "export const TARGET: string =",
        f"  {json.dumps(data['target'])};",
        "",
        "export const FEATURE_COUNT: number =",
        f"  {int(data['feature_count'])};",
        "",
        "export const CATEGORY_LABELS: Readonly<Record<CategoryKey, string>> = {",
        *[f'  {json.dumps(key)}: {json.dumps(label)},' for key, label in data["categories"].items()],
        "};",
        "",
        "export const CATEGORY_ORDER: readonly CategoryKey[] = [",
        *[f"  {json.dumps(key)}," for key in data["categories"]],
        "];",
        "",
        "export const SUBGROUP_LABELS: Readonly<Record<string, string>> = {",
        *[f"  {json.dumps(key)}: {json.dumps(label)}," for key, label in data.get("subgroup_labels", {}).items()],
        "};",
        "",
        "export const FEATURE_ORDER: readonly string[] = [",
        *[f"  {json.dumps(name)}," for name in data["feature_order"]],
        "];",
        "",
        "export const FEATURES: readonly FeatureSpec[] = [",
    ]
    for spec in data["features"]:
        lines.append("  {")
        for field in ("name", "field", "label", "unit", "domain", "category", "notes", "required", "type"):
            lines.append(f"    {field}: {to_ts_value(spec[field])},")
        if "min" in spec:
            lines.append(
                f"    min: {to_ts_value(spec['min'])}, max: {to_ts_value(spec['max'])},"
                + (f" mean: {to_ts_value(spec.get('mean'))}," if "mean" in spec else "")
            )
        if "derived" in spec and spec["derived"]:
            lines.append("    derived: true,")
        if "subgroup" in spec:
            lines.append(f"    subgroup: {json.dumps(spec['subgroup'])},")
        if "display" in spec:
            lines.append(
                "    display: { unit: "
                + json.dumps(spec["display"]["unit"])
                + ", factor: "
                + str(spec["display"]["factor"])
                + " },"
            )
        if "options" in spec:
            lines.append("    options: [" + ", ".join(json.dumps(o) for o in spec["options"]) + "],")
        if "encode" in spec:
            encoded = ", ".join(f"{json.dumps(k)}: {v}" for k, v in spec["encode"].items())
            lines.append(f"    encode: {{{encoded}}},")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    lines.append("const byName = new Map(FEATURES.map((f) => [f.name, f]));")
    lines.append("")
    lines.append("export function getFeature(name: string): FeatureSpec {")
    lines.append("  const spec = byName.get(name);")
    lines.append("  if (!spec) throw new Error(`Unknown feature: ${name}`);")
    lines.append("  return spec;")
    lines.append("}")
    lines.append("")
    lines.append("export function featuresInCategory(key: CategoryKey): readonly FeatureSpec[] {")
    lines.append("  return FEATURES.filter((f) => f.category === key);")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(build(), encoding="utf-8")
    count = len(json.loads(CONTRACT.read_text(encoding="utf-8"))["features"])
    print(f"Wrote {OUT} ({count} features)")


if __name__ == "__main__":
    sys.exit(main())