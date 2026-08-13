import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Trophy } from "lucide-react";

import { modelPerformance } from "./modelPerformanceData";

import styles from "./ModelPerformance.module.css";

const W = 200;
const H = 200;

/** Animated, count-of-bars metric display (mirrors Models page style). */
const barMetrics = [
  { label: "Accuracy", value: 0.9017, display: "90.17%" },
  { label: "Precision", value: 0.3614, display: "36.14%" },
  { label: "Recall", value: 0.4578, display: "45.78%" },
  { label: "F1 Score", value: 0.4039, display: "40.39%" },
  { label: "ROC AUC", value: 0.9051, display: "0.9051" },
  { label: "MCC", value: 0.3541, display: "0.3541" },
  { label: "Cohen's Kappa", value: 0.3512, display: "0.3512" },
];

function MetricBar({ label, value, display }: (typeof barMetrics)[number]) {
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
      <span className={styles.barValue}>{display}</span>
    </div>
  );
}

function toPath(points: { x: number; y: number }[]) {
  return points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${(p.x * W).toFixed(1)} ${(H - p.y * H).toFixed(1)}`
    )
    .join(" ");
}

function RocCurve() {
  const curvePath = toPath(modelPerformance.roc);
  const areaPath = `${curvePath} L ${W} ${H} Z`;

  return (
    <div className={styles.plot}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.rocSvg}
        role="img"
        aria-label="ROC curve for Random Forest with area under the curve of 0.9051"
      >
        {[0, 1, 2, 3, 4].map((n) => {
          const v = n * 50;
          return (
            <g key={n}>
              <line x1={0} y1={v} x2={W} y2={v} className={styles.gridline} />
              <line x1={v} y1={0} x2={v} y2={H} className={styles.gridline} />
            </g>
          );
        })}

        <line x1={0} y1={H} x2={W} y2={0} className={styles.diagonal} />

        <path d={areaPath} className={styles.area} />

        <path
          d={curvePath}
          pathLength={1}
          className={styles.curve}
        />

        <text x={4} y={H - 6} className={styles.legend}>
          AUC = 0.9051
        </text>
      </svg>
    </div>
  );
}

export default function ModelPerformance() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2>Best Model Performance Index</h2>

        <span className={styles.champBadge}>
          <Trophy size={14} />
          <span>
            <small>Best Performing Model</small>
            <strong>{modelPerformance.bestModel}</strong>
          </span>
        </span>
      </header>

      <div className={styles.metrics}>
        {modelPerformance.metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <p className={styles.summary}>{modelPerformance.summary}</p>

      <button
        type="button"
        className={styles.detailsToggle}
        onClick={() => setShowDetails((open) => !open)}
        aria-expanded={showDetails}
        aria-controls="model-details"
      >
        Additional metrics
        <ChevronDown
          size={14}
          className={showDetails ? styles.chevronOpen : undefined}
        />
      </button>

      {showDetails && (
        <dl id="model-details" className={styles.details}>
          {modelPerformance.details.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className={styles.rocPanel}>
        <p className={styles.rocTitle}>Random Forest ROC Curve</p>
        <div className={styles.rocLayout}>
          <RocCurve />
          <div className={styles.bars}>
            {barMetrics.map((m) => (
              <MetricBar key={m.label} {...m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}