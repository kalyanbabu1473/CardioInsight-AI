import type { CSSProperties } from "react";

import { DashboardWidget } from "@/components/ui";

import { recentActivity } from "./recentActivityData";

import styles from "./RecentActivity.module.css";

export default function RecentActivity() {
  return (
    <DashboardWidget title="Recent Activity" actionLabel="View All">
      <div className={styles.list}>
        {recentActivity.map((item) => {
          const Icon = item.icon;
          const style = { "--accent": item.tone } as CSSProperties;

          return (
            <div key={item.id} className={styles.item} style={style}>
              <div className={styles.iconWrap}>
                <Icon className={styles.icon} size={20} strokeWidth={2} />
              </div>

              <div className={styles.meta}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>

              <span className={styles.time}>{item.time}</span>
            </div>
          );
        })}
      </div>
    </DashboardWidget>
  );
}