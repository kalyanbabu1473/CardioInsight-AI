import clsx from "clsx";
import type { GlassPanelProps } from "./GlassPanel.types";
import styles from "./GlassPanel.module.css";

export default function GlassPanel({
  children,
  blur = "md",
  opacity = "medium",
  className,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={clsx(
        styles.glass,
        styles[blur],
        styles[opacity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}