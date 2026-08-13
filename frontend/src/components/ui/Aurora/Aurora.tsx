import { memo, useEffect, useRef } from "react";

import styles from "./Aurora.module.css";

const RGB = {
  blue900: "29, 78, 216",
  blue800: "37, 99, 235",
  blue600: "59, 130, 246",
  blue400: "96, 165, 250",
} as const;

interface RibbonConfig {
  id: string;
  top: string;
  height: number;
  rgb: string;
  alpha: number;
  blur: number;
  flowDuration: number;
  flowDelay: number;
  waveDuration: number;
  waveDelay: number;
}

const RIBBONS: RibbonConfig[] = [
  { id: "ribbon-1", top: "3%", height: 130, rgb: RGB.blue900, alpha: 0.5, blur: 55, flowDuration: 40, flowDelay: -6, waveDuration: 14, waveDelay: -3 },
  { id: "ribbon-2", top: "15%", height: 92, rgb: RGB.blue800, alpha: 0.42, blur: 45, flowDuration: 31, flowDelay: -19, waveDuration: 11, waveDelay: -5 },
  { id: "ribbon-3", top: "26%", height: 152, rgb: RGB.blue600, alpha: 0.5, blur: 62, flowDuration: 46, flowDelay: -12, waveDuration: 16, waveDelay: -8 },
  { id: "ribbon-4", top: "40%", height: 104, rgb: RGB.blue400, alpha: 0.4, blur: 50, flowDuration: 34, flowDelay: -27, waveDuration: 12, waveDelay: -2 },
  { id: "ribbon-5", top: "54%", height: 142, rgb: RGB.blue800, alpha: 0.46, blur: 58, flowDuration: 42, flowDelay: -3, waveDuration: 15, waveDelay: -10 },
  { id: "ribbon-6", top: "68%", height: 88, rgb: RGB.blue900, alpha: 0.38, blur: 44, flowDuration: 29, flowDelay: -23, waveDuration: 10, waveDelay: -6 },
  { id: "ribbon-7", top: "79%", height: 118, rgb: RGB.blue600, alpha: 0.42, blur: 52, flowDuration: 37, flowDelay: -15, waveDuration: 13, waveDelay: -4 },
];

const auroraGradient = (rgb: string, alpha: number): string => {
  const peak = Math.min(alpha + 0.12, 0.65);
  return [
    `rgba(${rgb}, 0) 0%`,
    `rgba(${rgb}, ${alpha}) 18%`,
    `rgba(${rgb}, ${peak}) 38%`,
    `rgba(${rgb}, ${alpha * 0.7}) 58%`,
    `rgba(${rgb}, ${alpha * 0.22}) 80%`,
    `rgba(${rgb}, 0) 96%`,
  ].join(", ");
};

function AuroraBase() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const togglePaused = () => {
      layer.classList.toggle(styles.paused, document.hidden);
    };

    togglePaused();
    document.addEventListener("visibilitychange", togglePaused);

    return () => document.removeEventListener("visibilitychange", togglePaused);
  }, []);

  return (
    <div ref={layerRef} className={styles.aurora} aria-hidden="true">
      {RIBBONS.map((ribbon) => (
        <div
          key={ribbon.id}
          className={styles.ribbon}
          style={{
            top: ribbon.top,
            height: `${ribbon.height}px`,
            animationDuration: `${ribbon.flowDuration}s`,
            animationDelay: `${ribbon.flowDelay}s`,
          }}
        >
          <div
            className={styles.ribbonCore}
            style={{
              background: `linear-gradient(90deg, ${auroraGradient(
                ribbon.rgb,
                ribbon.alpha,
              )})`,
              filter: `blur(${ribbon.blur}px)`,
              animationDuration: `${ribbon.waveDuration}s`,
              animationDelay: `${ribbon.waveDelay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default memo(AuroraBase);
