import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./ModelCard.module.css";

interface ModelCardProps {
  title: string;
  notebook: string;
  color: string;
  icon: LucideIcon;
}

export default function ModelCard({
  title,
  notebook,
  color,
  icon: Icon,
}: ModelCardProps) {
  const style = { "--accent": color } as CSSProperties;

  return (
    <div className={styles.card} style={style}>
      <div className={styles.iconWrap}>
        <Icon className={styles.icon} strokeWidth={2} />
      </div>

      <h4 className={styles.title}>{title}</h4>

      <span className={styles.badge}>{notebook}</span>
    </div>
  );
}