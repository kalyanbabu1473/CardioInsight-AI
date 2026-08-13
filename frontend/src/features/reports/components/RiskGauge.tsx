import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import type { CSSProperties } from "react";

import styles from "./RiskGauge.module.css";

interface RiskGaugeProps {
  /** Risk probability in the range 0–1. */
  value: number;
  /** Primary accent color for the progress arc. */
  color: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function RiskGauge({
  value,
  color,
  size = 220,
  strokeWidth = 14,
  label = "Predicted CVD Risk",
}: RiskGaugeProps) {
  const viewBox = 140;
  const radius = (viewBox - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));

  const [displayText, setDisplayText] = useState("0.0");

  useEffect(() => {
    const controls = animate(0, clamped * 100, {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplayText(latest.toFixed(1)),
    });
    return () => controls.stop();
  }, [clamped]);

  const gaugeStyle = {
    "--gauge-glow": `${color}55`,
  } as CSSProperties;

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient
            id="riskGaugeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.75" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={strokeWidth}
        />

        <motion.circle
          className={styles.progressArc}
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          stroke="url(#riskGaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 ${viewBox / 2} ${viewBox / 2})`}
          style={gaugeStyle}
        />
      </svg>

      <div className={styles.center}>
        <span className={styles.value} style={{ color }}>
          {displayText}%
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
