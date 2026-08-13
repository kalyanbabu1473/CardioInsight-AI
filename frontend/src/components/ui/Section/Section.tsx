import type { SectionProps } from "./Section.types";
import styles from "./Section.module.css";

export default function Section({
  title,
  subtitle,
  children,
}: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {children}
    </section>
  );
}