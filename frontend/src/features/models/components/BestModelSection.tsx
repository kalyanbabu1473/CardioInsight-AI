import { motion } from "framer-motion";
import { Crown, CheckCircle2, Zap, ShieldCheck } from "lucide-react";

import { models, datasetContext, finalConclusion } from "../modelsData";

import styles from "./BestModelSection.module.css";

const rf = models.find((m) => m.id === "random-forest")!;

export default function BestModelSection() {
  const workflow = [
    { icon: Zap, text: "Accept 20 clinical patient features" },
    { icon: ShieldCheck, text: "Class balance handled via class_weight='balanced'" },
    { icon: CheckCircle2, text: "Predict + output CVD probability" },
  ];

  return (
    <motion.article
      className={styles.hero}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.aura} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.head}>
        <span className={styles.crown}>
          <Crown size={20} />
        </span>
        <div>
          <span className={styles.eyebrow}>Research Champion</span>
          <h2>{rf.name}</h2>
          <p className={styles.lead}>
            Selected as the champion research model. The deployed CardioInsight
            AI classifier is a 20-clinical-feature Random Forest trained with
            the same hyperparameters (see the assessment wizard review page).
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.why}>
          <h3>Why Random Forest was selected</h3>
          <ul>
            <li>
              Highest ROC-AUC (0.9051) across all four models in the notebook
              comparison — the decisive ranking metric.
            </li>
            <li>
              Balanced overall accuracy (0.9017) while still capturing 46% of
              true CVD positives, beating the boosted baselines.
            </li>
            <li>
              Ensemble averaging reduces variance and resists overfitting on
              the 44 selected features.
            </li>
            <li>
              Native feature-importance and SHAP compatibility drive the
              platform&apos;s explainable-AI layer.
            </li>
          </ul>
        </section>

        <section className={styles.metrics}>
          <h3>Final Metrics</h3>
          <div className={styles.metricGrid}>
            {rf.metrics.map((m) => (
              <div key={m.label} className={styles.metric}>
                <strong>{(m.value * 100).toFixed(2)}%</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <p className={styles.context}>
            Evaluated on {datasetContext.testSamples} held-out test samples
            (train set = {datasetContext.trainSamples}).
          </p>
        </section>
      </div>

      <div className={styles.bottom}>
        <section className={styles.details}>
          <h3>Prediction workflow</h3>
          <div className={styles.workflow}>
            {workflow.map(({ icon: Icon, text }, idx) => (
              <div key={text} className={styles.wfStep}>
                <span className={styles.wfIcon}>
                  <Icon size={18} />
                </span>
                <span>{text}</span>
                {idx < workflow.length - 1 && <span className={styles.wfArrow}>→</span>}
              </div>
            ))}
          </div>

          <h3 className={styles.detailHead}>Advantages</h3>
          <ul className={styles.advList}>
            {rf.advantages.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          <h3 className={styles.detailHead}>Expected output</h3>
          <p className={styles.para}>
            A per-patient predicted CVD risk probability (0–1) and a
            categorical risk level (Low / Medium / High), returned in real time.
          </p>
        </section>

        <section className={styles.conclusion}>
          <h3>Research conclusion</h3>
          <p>{finalConclusion}</p>
          <div className={styles.reliability}>
            <ShieldCheck size={20} />
            <span>
              Model reliability is supported by balanced class handling,
              rigorous train/test separation and clear feature attribution.
            </span>
          </div>
        </section>
      </div>
    </motion.article>
  );
}