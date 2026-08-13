import { ChevronRight } from "lucide-react";
import type { DashboardWidgetProps } from "./DashboardWidget.types";

import styles from "./DashboardWidget.module.css";

export default function DashboardWidget({
  title,
  actionLabel,
  onActionClick,
  children,
}: DashboardWidgetProps) {
  return (
    <section className={styles.widget}>
      <header className={styles.header}>
        <h2>{title}</h2>

        {actionLabel && (
          <button
            onClick={onActionClick}
            className={styles.action}
          >
            {actionLabel}

            <ChevronRight size={16} />
          </button>
        )}
      </header>

      <div className={styles.body}>
        {children}
      </div>
    </section>
  );
}