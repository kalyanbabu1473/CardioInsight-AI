import { motion } from "framer-motion";
import { Lightbulb, Scale, AlertTriangle, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { researchInsights, finalConclusion } from "../modelsData";

import styles from "./ResearchInsights.module.css";

const icons: LucideIcon[] = [Award, AlertTriangle, Scale, Lightbulb];

export default function ResearchInsights() {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {researchInsights.map((insight, index) => {
          const Icon = icons[index % icons.length];
          return (
            <motion.div
              key={insight.title}
              className={styles.card}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <span className={styles.icon}>
                <Icon size={18} />
              </span>
              <h4>{insight.title}</h4>
              <p>{insight.body}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className={styles.conclusion}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
      >
        <h4>Final research conclusion</h4>
        <p>{finalConclusion}</p>
      </motion.div>
    </div>
  );
}