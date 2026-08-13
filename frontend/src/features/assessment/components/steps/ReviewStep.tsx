import { Cpu, Pencil, type LucideIcon } from "lucide-react";
import {
  CATEGORY_LABELS,
  featuresInCategory,
  type CategoryKey,
  type FeatureSpec,
} from "@/data/assessment/featureContract";

import { AiHealthDisclaimer, Button } from "@/components/ui";

import {
  PREDICTION_MODEL,
  calculateBmi,
  formatFeatureValue,
  type AssessmentInput,
} from "../../assessmentService";
import { WIZARD_STEPS } from "../wizardConfig";

import styles from "./steps.module.css";

interface ReviewStepProps {
  value: AssessmentInput;
  onEdit: (step: number) => void;
  onSubmit: () => void;
}

interface Section {
  step: number;
  icon: LucideIcon;
  title: string;
  rows: { label: string; value: string }[];
}

function bmiRows(value: AssessmentInput): { label: string; value: string }[] {
  const bmi = calculateBmi(
    value.bodyComposition.heightCm,
    value.bodyComposition.weightKg,
  );
  return bmi > 0
    ? [{ label: "Body mass index", value: `${bmi.toFixed(1)} kg/m²` }]
    : [];
}

export default function ReviewStep({ value, onEdit, onSubmit }: ReviewStepProps) {
  const sections: Section[] = WIZARD_STEPS.filter((s) => s.category).map((def) => {
    const category = def.category as CategoryKey;
    const section = value[
      category as keyof AssessmentInput
    ] as unknown as Record<string, number | string>;

    const rows = featuresInCategory(category)
      .filter((spec) => !spec.derived)
      .map((spec: FeatureSpec) => {
        const field = spec.field.split(".")[1];
        const raw = section[field];
        const display = formatFeatureValue(
          spec,
          raw as number | string,
        );
        return { label: spec.label, value: display };
      });

    return {
      step: def.index,
      icon: def.icon,
      title: CATEGORY_LABELS[category],
      rows: category === "bodyComposition"
        ? [...rows, ...bmiRows(value)]
        : rows,
    };
  });

  return (
    <div className={styles.reviewStack}>
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <section key={section.step} className={styles.reviewGroup}>
            <div className={styles.reviewGroupHeader}>
              <span className={styles.reviewGroupTitle}>
                <span className={styles.reviewGroupIcon}>
                  <Icon size={15} />
                </span>
                {section.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(section.step)}
              >
                <Pencil size={14} />
                Edit
              </Button>
            </div>

            <dl className={styles.reviewValues}>
              {section.rows.map((row) => (
                <div key={row.label} className={styles.reviewValue}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      <div className={styles.modelCard}>
        <div className={styles.modelIcon}>
          <Cpu size={20} />
        </div>
        <div className={styles.modelMeta}>
          <strong>{PREDICTION_MODEL.name}</strong>
          <span>{PREDICTION_MODEL.description}</span>
        </div>
      </div>

      <AiHealthDisclaimer />

      <div className={styles.runRow}>
        <Button
          variant="primary"
          size="lg"
          className={styles.runButton}
          onClick={onSubmit}
        >
          Run Assessment
        </Button>
      </div>
    </div>
  );
}