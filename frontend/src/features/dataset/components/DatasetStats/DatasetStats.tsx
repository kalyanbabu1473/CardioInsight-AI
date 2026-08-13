import type { CSSProperties } from "react";
import { Users, Database, Filter, Target } from "lucide-react";
import { projectInfo } from "@/data/dashboard/project";

import styles from "./DatasetStats.module.css";

const stats = [
  {
    title: "Participants",
    value: projectInfo.participants.toLocaleString(),
    icon: Users,
    color: "#3B82F6",
  },
  {
    title: "Engineered Features",
    value: projectInfo.initialFeatures.toString(),
    icon: Database,
    color: "#60A5FA",
  },
  {
    title: "Selected Features",
    value: projectInfo.selectedFeatures.toString(),
    icon: Filter,
    color: "#2563EB",
  },
  {
    title: "Target",
    value: projectInfo.target,
    icon: Target,
    color: "#93C5FD",
  },
];

export default function DatasetStats() {
  return (
    <section className={styles.grid}>
      {stats.map((item) => {
        const Icon = item.icon;
        const style = { "--accent": item.color } as CSSProperties;

        return (
          <div key={item.title} className={styles.card} style={style}>
            <div className={styles.iconWrap}>
              <Icon className={styles.icon} size={20} strokeWidth={2} />
            </div>

            <span className={styles.label}>{item.title}</span>

            <h2 className={styles.value}>{item.value}</h2>
          </div>
        );
      })}
    </section>
  );
}