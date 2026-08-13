import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui";

import styles from "./SectionHeading.module.css";

interface SectionHeadingProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
}

export default function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  badge,
}: SectionHeadingProps) {
  return (
    <header className={styles.heading}>
      <div className={styles.iconWrap}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className={styles.copy}>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {badge && <Badge variant="primary">{badge}</Badge>}
    </header>
  );
}
