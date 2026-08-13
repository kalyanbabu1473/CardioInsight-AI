import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { clsx } from "clsx";

import { WIZARD_STEPS } from "./wizardConfig";
import { STEP_COUNT } from "../assessmentService";

import styles from "./AssessmentStepper.module.css";

interface AssessmentStepperProps {
  currentStep: number;
  maxReachableStep: number;
  onStepClick: (step: number) => void;
}

export default function AssessmentStepper({
  currentStep,
  maxReachableStep,
  onStepClick,
}: AssessmentStepperProps) {
  const percent = Math.round(((currentStep - 1) / (STEP_COUNT - 1)) * 100);

  return (
    <div className={styles.stepper} data-sound-handled>
      <div className={styles.meta}>
        <span className={styles.metaLabel}>Assessment Workflow</span>
        <div className={styles.percent} aria-label="Workflow progress">
          <motion.span
            key={percent}
            className={styles.percentValue}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {percent}%
          </motion.span>
          <span className={styles.percentLabel}>complete</span>
        </div>
      </div>

      <div className={styles.track} role="tablist" aria-label="Assessment steps">
        {WIZARD_STEPS.map((step, index) => {
          const completed = step.index < currentStep;
          const active = step.index === currentStep;
          const reachable = step.index <= maxReachableStep;
          const Icon = step.icon;

          return (
            <Fragment key={step.index}>
              <button
                type="button"
                role="tab"
                aria-selected={active}
                aria-disabled={!reachable}
                className={clsx(
                  styles.item,
                  active && styles.itemActive,
                  completed && styles.itemCompleted,
                  !reachable && styles.itemLocked,
                )}
                onClick={() => {
                  if (reachable) onStepClick(step.index);
                }}
              >
                <span className={styles.nodeWrap}>
                  <span className={styles.node}>
                    <AnimatePresence mode="wait" initial={false}>
                      {completed ? (
                        <motion.span
                          key="check"
                          className={styles.nodeIcon}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        >
                          <Check size={14} strokeWidth={3} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="icon"
                          className={styles.nodeIcon}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <Icon size={14} strokeWidth={2.2} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className={styles.label}>{step.label}</span>
                </span>
              </button>

              {index < WIZARD_STEPS.length - 1 && (
                <span
                  className={clsx(
                    styles.connector,
                    step.index < currentStep && styles.connectorFilled,
                  )}
                  aria-hidden="true"
                />
              )}
            </Fragment>
          );
        })}
      </div>

      <div className={styles.progress}>
        <motion.div
          className={styles.progressFill}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
