import clsx from "clsx";
import type { CardProps } from "./Card.types";
import styles from "./Card.module.css";

export default function Card({
  children,
  variant = "default",
  className,
}: CardProps) {
  return (
    <div className={clsx(styles.card, styles[variant], className)}>
      {children}
    </div>
  );
}