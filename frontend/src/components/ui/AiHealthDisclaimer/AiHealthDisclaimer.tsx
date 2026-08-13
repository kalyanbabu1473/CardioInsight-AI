import clsx from "clsx";
import { ShieldAlert } from "lucide-react";

import styles from "./AiHealthDisclaimer.module.css";

export const AI_HEALTH_DISCLAIMER_FULL =
  "CardioInsight AI is an artificial intelligence based research and decision-support tool. Its predictions may be inaccurate or incomplete and must not be considered a medical diagnosis or a substitute for professional medical advice. Do not make health decisions based solely on this assessment. Please consult a qualified healthcare professional for any health-related concerns or decisions.";

export const AI_HEALTH_DISCLAIMER_SHORT =
  "Disclaimer: This AI-generated assessment is for informational and research purposes only and is not a medical diagnosis. Consult a qualified healthcare professional for health-related concerns.";

export const AI_HEALTH_DISCLAIMER_TITLE = "AI Health Disclaimer";

interface AiHealthDisclaimerProps {
  /** Heading shown above the notice body. */
  title?: string;
  /** Notice body; defaults to the full wording. */
  text?: string;
  className?: string;
}

/**
 * Subtle AI health-safety notice rendered inside a bordered, muted container.
 *
 * The full wording is intended for on-screen surfaces (assessment review,
 * report viewer); the shorter wording is used in the printable report.
 */
export default function AiHealthDisclaimer({
  title = AI_HEALTH_DISCLAIMER_TITLE,
  text = AI_HEALTH_DISCLAIMER_FULL,
  className,
}: AiHealthDisclaimerProps) {
  return (
    <aside className={clsx(styles.disclaimer, className)} role="note">
      <span className={styles.icon}>
        <ShieldAlert size={17} aria-hidden="true" />
      </span>
      <div className={styles.body}>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.text}>{text}</p>
      </div>
    </aside>
  );
}