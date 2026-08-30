import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

import styles from "./AnimatedBar.module.css";

export interface AnimatedBarProps {
  /** Fill proportion 0–1 (used when max is not set). */
  value?: number;
  /** Optional max; when set, fill = value/max clamped to [0,1]. */
  max?: number;
  /** Absolute fill value (alternative to value/max). */
  fill?: number;
  /** Custom fill color override. */
  color?: string;
  /** Marker position 0–1 (thin vertical indicator). */
  marker?: number;
  /** Marker color override. */
  markerColor?: string;
  /** Bar height token or px value. Default "md". */
  height?: "sm" | "md" | "lg";
  /** Delay before animation starts (seconds). */
  delay?: number;
  /** Disable entrance animation. */
  animate?: boolean;
  /** Additional CSS class for the root element. */
  className?: string;
  /** Accessible label. */
  ariaLabel?: string;
  children?: React.ReactNode;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export default function AnimatedBar({
  value,
  max,
  fill,
  color,
  marker,
  markerColor,
  height = "md",
  delay = 0,
  animate = true,
  className,
  ariaLabel,
  children,
}: AnimatedBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!animate || shouldReduceMotion) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, shouldReduceMotion]);

  // Calculate fill percentage
  let fillPct: number;
  if (fill !== undefined) {
    fillPct = clamp(fill, 0, 100);
  } else if (max !== undefined && max > 0 && value !== undefined) {
    fillPct = clamp((value / max) * 100, 0, 100);
  } else {
    fillPct = clamp(value ?? 0, 0, 100);
  }

  const showMarker = marker !== undefined && marker >= 0 && marker <= 1;
  const markerPct = clamp((marker ?? 0) * 100, 0, 100);

  const duration = shouldReduceMotion ? 0 : 1;

  return (
    <div
      ref={ref}
      className={clsx(styles.track, styles[height], className)}
      role="meter"
      aria-valuenow={Math.round(fillPct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <motion.div
        className={styles.fill}
        style={color ? { backgroundColor: color } : undefined}
        initial={{ width: "0%" }}
        animate={{ width: inView ? `${fillPct}%` : "0%" }}
        transition={{
          duration,
          delay: shouldReduceMotion ? 0 : delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
      {showMarker && (
        <motion.div
          className={styles.marker}
          style={markerColor ? { backgroundColor: markerColor } : undefined}
          initial={{ left: "0%", opacity: 0 }}
          animate={{
            left: inView ? `${markerPct}%` : "0%",
            opacity: inView ? 1 : 0,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.6,
            delay: shouldReduceMotion ? 0 : delay + 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      )}
      {children}
    </div>
  );
}
