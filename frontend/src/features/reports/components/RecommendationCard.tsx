import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { Check } from "lucide-react";

import styles from "./RecommendationCard.module.css";

export type RecommendationVariant = "lifestyle" | "monitoring" | "medical";

interface RecommendationCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  variant: RecommendationVariant;
  items: string[];
}

export default function RecommendationCard({
  title,
  subtitle,
  icon: Icon,
  variant,
  items,
}: RecommendationCardProps) {
  return (
    <article className={clsx(styles.card, styles[variant])}>
      <header className={styles.header}>
        <div className={clsx(styles.iconWrap, styles[`${variant}Icon`])}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <div className={styles.titleWrap}>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item} className={styles.item}>
            <span className={styles.check}>
              <Check size={13} strokeWidth={3} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
