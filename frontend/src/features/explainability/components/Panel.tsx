import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, Badge } from "@/components/ui";

import styles from "./Panel.module.css";

interface PanelProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
}

export default function Panel({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
}: PanelProps) {
  return (
    <Card variant="glass" className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.iconWrap}>
          <Icon size={20} strokeWidth={2} />
        </div>

        <div className={styles.heading}>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {badge && <Badge variant="primary">{badge}</Badge>}
      </header>

      <div className={styles.body}>{children}</div>
    </Card>
  );
}