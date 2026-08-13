import clsx from "clsx";
import type { BadgeProps } from "./Badge.types";
import styles from "./Badge.module.css";

export default function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span
      className={clsx(
        styles.badge,
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}