import { motion } from "framer-motion";

import { models, figures } from "../modelsData";

import styles from "./EvaluationDashboard.module.css";

function ConfusionMatrix({ model }: { model: (typeof models)[number] }) {
  const c = model.confusion;
  const cells = [
    { label: `${c.tp}`, title: "True Positive", tone: "tp" },
    { label: `${c.fn}`, title: "False Negative", tone: "fn" },
    { label: `${c.fp}`, title: "False Positive", tone: "fp" },
    { label: `${c.tn}`, title: "True Negative", tone: "tn" },
  ];
  return (
    <div className={styles.cm}>
      <h5>{model.name}</h5>
      <div className={styles.cmTitles}>
        <span />
        <span>Predicted</span>
      </div>
      <div className={styles.cmRow}>
        <span className={styles.actual}>Actual</span>
        <div className={styles.cmGrid}>
          {cells.map((cell) => (
            <div
              key={cell.title}
              className={`${styles.cmCell} ${styles[cell.tone]}`}
              title={cell.title}
            >
              <strong>{cell.label}</strong>
              <span>{cell.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      className={styles.tile}
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
    >
      <strong>{(value * 100).toFixed(2)}%</strong>
      <span>{label}</span>
    </motion.div>
  );
}

export default function EvaluationDashboard() {
  return (
    <div className={styles.stack}>
      <div className={styles.grid}>
        {models.map((model) => (
          <motion.div
            key={model.id}
            className={styles.modelMetrics}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
          >
            <h4>{model.name}</h4>
            <div className={styles.tileGrid}>
              {model.metrics.map((m) => (
                <MetricTile key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.cmWrap}>
        <h3>Confusion Matrices</h3>
        <p className={styles.caption}>
          Derived from each model&apos;s classification report on the 3,092-sample
          test set.
        </p>
        <div className={styles.cmPanel2}>
          {models.map((model) => (
            <ConfusionMatrix key={model.id} model={model} />
          ))}
        </div>
      </div>

      <div className={styles.figures}>
        <h3>Actual Notebook Evaluation Plots</h3>
        <p className={styles.caption}>
          Figures saved directly from the model development notebooks.
        </p>
        <div className={styles.figureGrid}>
          <figure className={styles.figure}>
            <img src={figures.accuracy} alt="Accuracy comparison bar chart" loading="lazy" />
            <figcaption>Accuracy Comparison</figcaption>
          </figure>
          <figure className={styles.figure}>
            <img src={figures.rocAuc} alt="ROC-AUC comparison bar chart" loading="lazy" />
            <figcaption>ROC-AUC Comparison</figcaption>
          </figure>
          <figure className={styles.figure}>
            <img src={figures.f1} alt="F1 comparison bar chart" loading="lazy" />
            <figcaption>F1 Score Comparison</figcaption>
          </figure>
          <figure className={styles.figure}>
            <img src={figures.rocComparison} alt="ROC curve comparison" loading="lazy" />
            <figcaption>ROC Curves Overlay</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}