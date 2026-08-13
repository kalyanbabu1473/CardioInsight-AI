import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { shapSummary } from "../explainabilityData";

import styles from "./ShapSummary.module.css";

function ShapTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number; payload?: { name?: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0];
  const value = item.value ?? 0;

  return (
    <div className={styles.tip}>
      <div className={styles.tipLabel}>{item.payload?.name}</div>
      <div className={styles.tipValue}>
        {value >= 0 ? "+" : ""}
        {value.toFixed(3)} mean |SHAP|
      </div>
    </div>
  );
}

export default function ShapSummary() {
  return (
    <div>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={shapSummary}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={76}
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-alt)" }}
              content={<ShapTooltip />}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={14}>
              {shapSummary.map((row) => (
                <Cell
                  key={row.name}
                  fill={row.value >= 0 ? "var(--color-purple)" : "var(--color-ai)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.positive}`} />
          Increases risk
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.negative}`} />
          Decreases risk
        </span>
      </div>
    </div>
  );
}