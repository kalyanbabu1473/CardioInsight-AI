import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import styles from "./StageCard.module.css";

interface StageCardProps {
  phase: string;
  title: string;
  notebooks: string[];
  color: string;
  icon: LucideIcon;
}

export default function StageCard({
  phase,
  title,
  notebooks,
  color,
  icon: Icon,
}: StageCardProps) {
  const style = { "--accent": color } as CSSProperties;

  return (
    <div className={styles.card} style={style}>
      <span className={styles.accent} aria-hidden="true" />

      <div className={styles.body}>
        <div className={styles.iconBox}>
          <Icon className={styles.icon} strokeWidth={2} />
        </div>

        <div className={styles.content}>
          <span className={styles.phase}>{phase}</span>
          <h3 className={styles.title}>{title}</h3>

          <div className={styles.badges}>
            {notebooks.map((nb) => (
              <span key={nb} className={styles.badge}>
                {nb}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.status} aria-label="complete">
          <CheckCircle2 className={styles.check} size={24} />
        </div>
      </div>
    </div>
  );
}