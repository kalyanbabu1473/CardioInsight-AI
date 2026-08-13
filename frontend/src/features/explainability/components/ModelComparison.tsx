import { modelComparison } from "../explainabilityData";

import styles from "./ModelComparison.module.css";

const bestAuc = Math.max(...modelComparison.map((row) => row.auc));

function MetricCell({ value }: { value: number }) {
  return (
    <td>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${value * 100}%` }} />
      </div>
    </td>
  );
}

function MetricRow({ row }: { row: (typeof modelComparison)[number] }) {
  const isBest = row.auc === bestAuc;

  return (
    <tr>
      <td className={`${styles.model} ${isBest ? styles.best : ""}`}>
        {row.model}
        {isBest && " ★"}
      </td>
      <MetricCell value={row.accuracy} />
      <MetricCell value={row.precision} />
      <MetricCell value={row.recall} />
      <MetricCell value={row.f1} />
      <MetricCell value={row.auc} />
    </tr>
  );
}

export default function ModelComparison() {
  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Model</th>
            <th>Acc</th>
            <th>Prec</th>
            <th>Rec</th>
            <th>F1</th>
            <th>AUC</th>
          </tr>
        </thead>
        <tbody>
          {modelComparison.map((row) => (
            <MetricRow key={row.model} row={row} />
          ))}
        </tbody>
      </table>

      <p className={styles.note}>
        Stars (★) mark the best-performing model by ROC-AUC.
      </p>
    </div>
  );
}