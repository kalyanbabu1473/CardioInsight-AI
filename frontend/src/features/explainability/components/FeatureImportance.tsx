import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import { featureImportance } from "../explainabilityData";

import styles from "./FeatureImportance.module.css";

const options = [5, 10, 15];
const TIP_GAP = 10;
const TIP_MARGIN = 10;

interface TipPosition {
  x: number;
  y: number;
  placement: "top" | "bottom";
}

export default function FeatureImportance() {
  const [topN, setTopN] = useState(10);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);
  const [pos, setPos] = useState<TipPosition | null>(null);

  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const max = featureImportance[0].importance;
  const visible = featureImportance.slice(0, topN);

  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const positionTip = useCallback((index: number) => {
    const row = rowRefs.current[index];
    const tipEl = tipRef.current;
    if (!row || !tipEl) {
      return;
    }

    const rowRect = row.getBoundingClientRect();
    const tipWidth = tipEl.offsetWidth;
    const tipHeight = tipEl.offsetHeight;

    const centerX = rowRect.left + rowRect.width / 2;
    const x = Math.max(
      TIP_MARGIN,
      Math.min(centerX - tipWidth / 2, window.innerWidth - tipWidth - TIP_MARGIN),
    );

    const spaceAbove = rowRect.top - TIP_GAP;
    if (spaceAbove >= tipHeight) {
      setPos({ x, y: rowRect.top - tipHeight - TIP_GAP, placement: "top" });
    } else {
      setPos({ x, y: rowRect.bottom + TIP_GAP, placement: "bottom" });
    }
  }, []);

  const showTip = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const hideTip = useCallback(() => {
    setActiveIndex(null);
  }, []);

  useLayoutEffect(() => {
    if (activeIndex === null) {
      setPos(null);
      return;
    }
    positionTip(activeIndex);
  }, [activeIndex, positionTip]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }
    const reposition = () => positionTip(activeIndex);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [activeIndex, positionTip]);

  const active = activeIndex !== null ? featureImportance[activeIndex] : null;

  return (
    <div>
      <div className={styles.list}>
        {visible.map((feature, index) => {
          const pct = (feature.importance * 100).toFixed(1);
          const widthPct = (feature.importance / max) * 100;
          const isActive = activeIndex === index;

          return (
            <button
              type="button"
              key={feature.name}
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              className={clsx(
                styles.row,
                isActive && styles.rowActive,
              )}
              onMouseEnter={() => showTip(index)}
              onMouseLeave={hideTip}
              onFocus={() => showTip(index)}
              onBlur={hideTip}
              aria-describedby={isActive ? `fi-tip-${index}` : undefined}
            >
              <span className={styles.label}>{feature.name}</span>
              <span className={styles.value}>{pct}%</span>
              <span className={styles.track} aria-hidden="true">
                <span
                  className={styles.fill}
                  style={{ width: grown ? `${widthPct}%` : "0%" }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.controls} role="group" aria-label="Items to show">
        {options.map((count) => (
          <button
            key={count}
            type="button"
            className={clsx(styles.control, topN === count && styles.active)}
            onClick={() => {
              setTopN(count);
              hideTip();
            }}
            aria-pressed={topN === count}
          >
            Top {count}
          </button>
        ))}
      </div>

      {active !== null && pos !== null && activeIndex !== null && activeIndex < visible.length
        ? createPortal(
            <div
              id={`fi-tip-${activeIndex}`}
              ref={tipRef}
              role="tooltip"
              className={clsx(
                styles.tip,
                pos.placement === "bottom" && styles.tipBottom,
              )}
              style={{ left: pos.x, top: pos.y }}
            >
              <div className={styles.tipHeader}>
                <span className={styles.tipRank}>#{activeIndex + 1}</span>
                <span className={styles.tipName}>{active.name}</span>
              </div>
              <p className={styles.tipDesc}>{active.description}</p>
              <div className={styles.tipMetric}>
                <strong>{(active.importance * 100).toFixed(1)}%</strong>
                <span>relative importance</span>
              </div>
              <p className={styles.tipNote}>
                <span className={styles.tipNoteLabel}>Why it matters</span>
                {active.note}
              </p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}