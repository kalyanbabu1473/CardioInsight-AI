import {
  SUBGROUP_LABELS,
  featuresInCategory,
  type CategoryKey,
  type FeatureSpec,
} from "@/data/assessment/featureContract";

import { calculateBmi, type StepErrors } from "../../assessmentService";
import { AutoValueField, NumberField, SegmentField } from "../FormField";

import styles from "./steps.module.css";

interface CategoryStepProps {
  category: CategoryKey;
  value: Record<string, number | string>;
  onChange: (patch: Record<string, number | string>) => void;
  errors: StepErrors;
}

/**
 * Generic contract-driven step: renders one field per feature in the category,
 * with ranges/units/labels straight from feature_contract.json. The single
 * derived feature (body mass index) is shown read-only, computed live.
 *
 * Features that carry a `subgroup` (e.g. blood vs urinary toxins) are laid out
 * under a column per subgroup so the sample type is unambiguous.
 */
function renderField(
  spec: FeatureSpec,
  current: number | string | undefined,
  errors: StepErrors,
  onChange: (patch: Record<string, number | string>) => void,
) {
  const key = spec.field.split(".")[1];

  if (spec.derived) {
    return null;
  }

  if (spec.type === "categorical") {
    return (
      <SegmentField
        key={spec.name}
        id={spec.name}
        label={spec.label}
        value={String(current ?? "")}
        options={spec.options ?? []}
        error={errors[spec.name]}
        onChange={(option) => onChange({ [key]: option })}
      />
    );
  }

  const display = spec.display;
  const factor = display?.factor ?? 1;
  const unit = display?.unit ?? spec.unit;
  const min = spec.min !== undefined ? spec.min / factor : undefined;
  const max = spec.max !== undefined ? spec.max / factor : undefined;
  const mean = spec.mean !== undefined ? spec.mean / factor : undefined;
  const range = min !== undefined && max !== undefined
    ? `Range: ${min}–${max} ${unit}`
    : undefined;
  const suggestion = mean !== undefined
    ? `Typical value: ${mean.toFixed(1)} ${unit}`
    : undefined;

  return (
    <NumberField
      key={spec.name}
      id={spec.name}
      label={spec.label}
      value={(Number(current) || 0) / factor}
      suffix={unit}
      min={min}
      max={max}
      step={0.1}
      placeholder={mean !== undefined ? `≈ ${mean.toFixed(1)}` : ""}
      hint={spec.notes}
      range={range}
      suggestion={suggestion}
      error={errors[spec.name]}
      onChange={(next) => onChange({ [key]: next * factor })}
    />
  );
}

export default function CategoryStep({
  category,
  value,
  onChange,
  errors,
}: CategoryStepProps) {
  const specs = featuresInCategory(category);

  if (category === "bodyComposition") {
    return (
      <div className={styles.fieldGrid}>
        {specs.map((spec) => {
          const key = spec.field.split(".")[1];
          const current = value[key];
          if (spec.derived) {
            const bmi = calculateBmi(
              Number(value.heightCm) || 0,
              Number(value.weightKg) || 0,
            );
            return (
              <AutoValueField
                key={spec.name}
                label={spec.label}
                value={bmi > 0 ? bmi.toFixed(1) : "—"}
                suffix={spec.unit}
                status={
                  <span>
                    {bmi > 0
                      ? "Derived from height & weight"
                      : "Computed automatically"}
                  </span>
                }
                hint={spec.notes}
              />
            );
          }
          return renderField(spec, current, errors, onChange);
        })}
      </div>
    );
  }

  const subgroups = new Map<string, FeatureSpec[]>();
  for (const spec of specs) {
    const group = spec.subgroup ?? "_";
    if (!subgroups.has(group)) subgroups.set(group, []);
    subgroups.get(group)!.push(spec);
  }

  if (subgroups.size <= 1) {
    return (
      <div className={styles.fieldGrid}>
        {specs.map((spec) => {
          const key = spec.field.split(".")[1];
          return renderField(spec, value[key], errors, onChange);
        })}
      </div>
    );
  }

  return (
    <div className={styles.subgroupColumns}>
      {[...subgroups.entries()].map(([group, groupSpecs]) => (
        <div key={group} className={styles.subgroupColumn}>
          <h3 className={styles.subgroupTitle}>
            {SUBGROUP_LABELS[group] ?? group[0].toUpperCase() + group.slice(1)}
          </h3>
          <div className={styles.fieldGrid}>
            {groupSpecs.map((spec) => {
              const key = spec.field.split(".")[1];
              return renderField(spec, value[key], errors, onChange);
            })}
          </div>
        </div>
      ))}
    </div>
  );
}