import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./Skeleton.module.css";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function Skeleton({
  width,
  height = 16,
  radius,
  circle = false,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn(styles.skeleton, circle && styles.circle, className)}
      style={{
        width,
        height,
        borderRadius: radius ? radius : undefined,
        ...style,
      }}
      {...rest}
    />
  );
}