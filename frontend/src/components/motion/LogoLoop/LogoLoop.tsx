import { Children } from "react";
import type { CSSProperties } from "react";
import clsx from "clsx";

import type { LogoLoopProps } from "./LogoLoop.types";

import styles from "./LogoLoop.module.css";

export default function LogoLoop({
  children,
  speed = 45,
  gap = 24,
  pauseOnHover = true,
  fadeEdges = true,
  edgeWidth = 120,
  className,
  ariaLabel = "Scrolling content carousel",
}: LogoLoopProps) {
  const items = Children.toArray(children);

  if (items.length === 0) {
    return null;
  }

  const trackStyle = {
    "--logo-duration": `${speed}s`,
    "--logo-gap": `${gap}px`,
  } as CSSProperties;

  const viewportStyle = {
    "--edge-width": `${edgeWidth}px`,
  } as CSSProperties;

  const renderGroup = (key: "original" | "duplicate") => (
    <div
      key={key}
      className={styles.group}
      aria-hidden={key === "duplicate" ? "true" : undefined}
    >
      {items}
    </div>
  );

  return (
    <div
      className={clsx(styles.viewport, fadeEdges && styles.fadeEdges, className)}
      style={viewportStyle}
      role="region"
      aria-label={ariaLabel}
      data-no-scroll-sound
    >
      <div
        className={clsx(styles.track, pauseOnHover && styles.pauseOnHover)}
        style={trackStyle}
      >
        {renderGroup("original")}
        {renderGroup("duplicate")}
      </div>
    </div>
  );
}