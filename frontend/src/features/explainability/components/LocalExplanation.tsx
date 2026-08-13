import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import {
  localExplanation,
  localRiskBase,
  localRiskFinal,
} from "../explainabilityData";

import styles from "./LocalExplanation.module.css";

const maxAbs = Math.max(
  ...localExplanation.map((item) => Math.abs(item.contribution)),
);

export default function LocalExplanation() {
  const delta = localRiskFinal - localRiskBase;
  const riskLevel = localRiskFinal >= 0.5 ? "High" : "Moderate";

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      <div className={styles.riskBanner}>
        <div className={styles.riskBlock}>
          <div className={styles.riskLabel}>Baseline</div>
          <div className={styles.riskValue}>
            {(localRiskBase * 100).toFixed(0)}%
          </div>
        </div>

        <span className={styles.arrow}>
          <ArrowRight size={22} />
        </span>

        <div className={styles.riskBlock}>
          <div className={styles.riskLabel}>Predicted Risk</div>
          <div className={styles.riskValue}>
            {(localRiskFinal * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className={styles.riskChip}>
        {riskLevel} cardiovascular risk &middot; &Delta;{(delta * 100).toFixed(0)}%
      </div>

      <div className={styles.list}>
        {localExplanation.map((item) => {
          const positive = item.contribution >= 0;
          const width = `${(Math.abs(item.contribution) / maxAbs) * 100}%`;

          return (
            <motion.div
              key={item.name}
              className={styles.item}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className={styles.meta}>
                <strong>{item.name}</strong>
                <span>{item.value}</span>
              </div>

              <span
                className={`${styles.contribution} ${
                  positive ? styles.pos : styles.neg
                }`}
              >
                {positive ? "+" : ""}
                {item.contribution.toFixed(3)}
              </span>

              <div className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    width,
                    background: positive
                      ? "var(--color-danger)"
                      : "var(--color-success)",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}