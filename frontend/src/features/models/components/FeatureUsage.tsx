import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  randomForestImportance,
  mutualInformation,
  lassoImportance,
  featureConsensus,
} from "../modelsData";

import styles from "./FeatureUsage.module.css";

function BarList({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: { feature: string; value: number }[];
  unit: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(...rows.map((r) => r.value));

  return (
    <div className={styles.panel} ref={ref}>
      <h4>{title}</h4>
      <div className={styles.bars}>
        {rows.map((row) => (
          <div key={row.feature} className={styles.row}>
            <span className={styles.feature}>{row.feature}</span>
            <div className={styles.track}>
              <motion.div
                className={styles.fill}
                initial={{ width: "0%" }}
                animate={{ width: inView ? `${(row.value / max) * 100}%` : "0%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className={styles.value}>
              {row.value.toFixed(4)} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeatureUsage() {
  return (
    <div className={styles.grid}>
      <BarList
        title="Random Forest Feature Importance"
        rows={randomForestImportance.map(({ feature, importance }) => ({
          feature,
          value: importance,
        }))}
        unit=""
      />
      <BarList
        title="Mutual Information"
        rows={mutualInformation}
        unit=""
      />
      <BarList
        title="LASSO Coefficients"
        rows={lassoImportance}
        unit=""
      />

      <div className={styles.panel}>
        <h4>Consensus Features (RF + MI + LASSO)</h4>
        <p className={styles.note}>
          Features selected by all three methods on the training set, forming
          the final 44-feature matrix used by every model.
        </p>
        <div className={styles.consensusGrid}>
          {featureConsensus.map((f) => (
            <div key={f.feature} className={styles.consensusItem}>
              <span className={styles.consensusFeature}>{f.feature}</span>
              <span className={styles.consensusScore}>3/3</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}