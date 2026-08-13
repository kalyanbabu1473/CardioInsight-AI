import type { CSSProperties } from "react";

import { Stagger, StaggerItem } from "@/components/motion";

import styles from "./KpiGrid.module.css";
import { dashboardMetrics } from "@/data/dashboard/metrics";

export default function KpiGrid() {
  return (
    <Stagger className={styles.grid}>
      {dashboardMetrics.map((item) => {
        const Icon = item.icon;
        const style = { "--accent": item.color } as CSSProperties;

        return (
          <StaggerItem
            key={item.title}
            className={styles.card}
            style={style}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
          >
            <div className={styles.iconWrap}>
              <Icon className={styles.icon} size={24} strokeWidth={2} />
            </div>

            <h4 className={styles.title}>{item.title}</h4>
            <h2 className={styles.value}>{item.value}</h2>
            <p className={styles.subtitle}>{item.subtitle}</p>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}