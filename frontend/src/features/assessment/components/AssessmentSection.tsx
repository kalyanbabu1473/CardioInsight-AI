import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import styles from "./AssessmentSection.module.css";

interface AssessmentSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  stepNumber?: string;
  badge?: ReactNode;
  children: ReactNode;
}

export default function AssessmentSection({
  icon: Icon,
  title,
  description,
  stepNumber,
  badge,
  children,
}: AssessmentSectionProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.iconWrap}>
          <Icon size={20} strokeWidth={2.2} />
        </div>

        <div className={styles.titleWrap}>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className={styles.meta}>
          {badge}
          {stepNumber && <span className={styles.stepNumber}>{stepNumber}</span>}
        </div>
      </header>

      <div className={styles.body}>{children}</div>
    </section>
  );
}
