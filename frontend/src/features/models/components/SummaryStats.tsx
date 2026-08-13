import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import styles from "./SummaryStats.module.css";

export interface SummaryStat {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface SummaryStatsProps {
  stats: SummaryStat[];
}

export default function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <div className={styles.grid}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.iconWrap}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <div className={styles.meta}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
