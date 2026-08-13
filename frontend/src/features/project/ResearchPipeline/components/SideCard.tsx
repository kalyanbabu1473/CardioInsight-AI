import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./SideCard.module.css";

interface SideCardProps {
  icon: LucideIcon;
  title: string;
  items: string[];
  color: string;
}

export default function SideCard({
  icon: Icon,
  title,
  items,
  color,
}: SideCardProps) {
  const style = { "--accent": color } as CSSProperties;

  return (
    <div className={styles.card} style={style}>
      <div className={styles.iconWrap}>
        <Icon className={styles.icon} strokeWidth={2} />
      </div>

      <h3 className={styles.title}>{title}</h3>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}