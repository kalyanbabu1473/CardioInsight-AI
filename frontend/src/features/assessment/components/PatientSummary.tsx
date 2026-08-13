import clsx from "clsx";
import { motion } from "framer-motion";
import { AlertCircle, Check, CircleDot, Cpu, ShieldCheck } from "lucide-react";

import {
  PREDICTION_MODEL,
  stepLabel,
  type RiskResult,
} from "../assessmentService";
import { WIZARD_STEPS } from "./wizardConfig";

import styles from "./PatientSummary.module.css";

interface PatientSummaryProps {
  /** Indices of wizard steps the user has validated and passed. */
  completedSteps: number[];
  currentStep: number;
  result: RiskResult | null;
}

const REQUIRED_STEP_INDICES = WIZARD_STEPS.filter((s) => s.category).map(
  (s) => s.index,
);

function CompletionRing({ percent }: { percent: number }) {
  const size = 84;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={styles.ringWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={styles.ringValue}>{Math.round(clamped)}%</span>
    </div>
  );
}

function statusFor(
  result: RiskResult | null,
  completed: number,
  total: number,
): { label: string; tone: "idle" | "active" | "complete" } {
  if (result) return { label: "Complete", tone: "complete" };
  if (completed === total) return { label: "Review ready", tone: "active" };
  if (completed > 0) return { label: "In progress", tone: "active" };
  return { label: "Not started", tone: "idle" };
}

export default function PatientSummary({
  completedSteps,
  currentStep,
  result,
}: PatientSummaryProps) {
  const completed = REQUIRED_STEP_INDICES.filter((s) =>
    completedSteps.includes(s),
  ).length;
  const percent = (completed / REQUIRED_STEP_INDICES.length) * 100;
  const missing = REQUIRED_STEP_INDICES.filter(
    (s) => !completedSteps.includes(s),
  );
  const status = statusFor(result, completed, REQUIRED_STEP_INDICES.length);

  const isSectionDone = (index: number) =>
    completedSteps.includes(index) || currentStep > index;

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h3>Patient Summary</h3>
          <p>Live record preview</p>
        </div>
        <span className={styles.liveBadge}>
          <CircleDot size={11} />
          Live
        </span>
      </header>

      <div className={styles.completion}>
        <CompletionRing percent={percent} />
        <div className={styles.completionMeta}>
          <span className={styles.completionLabel}>Patient Completion</span>
          <span className={styles.completionDetail}>
            {completed} of {REQUIRED_STEP_INDICES.length} required sections
          </span>
        </div>
      </div>

      <div className={styles.statusRow}>
        <span className={styles.statusLabel}>Status</span>
        <span className={clsx(styles.status, styles[status.tone])}>
          {status.label}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <span className={styles.groupLabel}>Current Step</span>
        <div className={styles.currentStep}>
          <span className={styles.stepIndex}>{currentStep}</span>
          <span className={styles.stepName}>{stepLabel(currentStep)}</span>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Completed Sections</span>
        {WIZARD_STEPS.filter((s) => s.category).map((step) => {
          const done = isSectionDone(step.index);
          return (
            <div
              key={step.index}
              className={clsx(styles.sectionItem, done && styles.sectionDone)}
            >
              <span className={styles.sectionIcon}>
                {done ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <step.icon size={13} strokeWidth={2} />
                )}
              </span>
              <span className={styles.sectionName}>{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.divider} />

      {missing.length > 0 && (
        <div className={styles.group}>
          <span className={styles.groupLabel}>Missing Information</span>
          <ul className={styles.missingList}>
            {missing.map((section) => (
              <li key={section} className={styles.missingItem}>
                <AlertCircle size={13} />
                <span>{stepLabel(section)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.divider} />

      <div className={styles.modelCard}>
        <div className={styles.modelIcon}>
          <Cpu size={17} strokeWidth={2.2} />
        </div>
        <div className={styles.modelMeta}>
          <span className={styles.modelName}>{PREDICTION_MODEL.name}</span>
          <span className={styles.modelTag}>{PREDICTION_MODEL.tagline}</span>
        </div>
        <ShieldCheck className={styles.modelShield} size={18} />
      </div>
    </aside>
  );
}