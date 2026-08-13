import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Cpu } from "lucide-react";

import { models } from "../modelsData";

import styles from "./ModelComparisonCards.module.css";

function MetricBar({ label, value }: { label: string; value: number }) {
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
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.barRow} ref={ref}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.track}>
        <motion.div
          className={styles.fill}
          initial={{ width: "0%" }}
          animate={{ width: inView ? `${value * 100}%` : "0%" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className={styles.barValue}>{(value * 100).toFixed(1)}%</span>
    </div>
  );
}

export default function ModelComparisonCards() {
  return (
    <div className={styles.grid}>
      {models.map((model, index) => {
        const best = model.production;
        return (
          <motion.article
            key={model.id}
            className={`${styles.card} ${best ? styles.production : ""}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
          >
            {best && (
              <div className={styles.ribbon}>
                <span className={styles.ribbonIcon}>
                  <CheckCircle2 size={14} />
                </span>
                Production Model
              </div>
            )}

            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.iconWrap}>
                  <Cpu size={22} />
                </div>
                <h3>{model.name}</h3>
              </div>
              <span className={styles.tagline}>{model.tagline}</span>
            </header>

            <p className={styles.explanation}>{model.explanation}</p>

            <div className={styles.chips}>
              <span className={styles.chip}>{model.trainingStatus}</span>
              <span className={styles.chip}>{model.hyperparams[0].value}</span>
            </div>

            <div className={styles.metrics}>
              {model.metrics.map((m) => (
                <MetricBar key={m.label} label={m.label} value={m.value} />
              ))}
            </div>

            <div className={styles.twoCol}>
              <div>
                <h5>Advantages</h5>
                <ul>
                  {model.advantages.slice(0, 3).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5>Limitations</h5>
                <ul>
                  {model.limitations.slice(0, 3).map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className={styles.useCase}>
              <strong>Best for:</strong> {model.bestUseCase}
            </p>
          </motion.article>
        );
      })}
    </div>
  );
}