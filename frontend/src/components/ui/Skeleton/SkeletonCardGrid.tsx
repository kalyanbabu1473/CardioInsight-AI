import type { CSSProperties } from "react";
import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export interface SkeletonCardGridProps {
  cards?: number;
  cols?: number;
}

export default function SkeletonCardGrid({ cards = 6, cols = 3 }: SkeletonCardGridProps) {
  return (
    <div
      className={styles.cardGrid}
      style={{ "--grid-cols": cols } as CSSProperties}
      role="presentation"
      aria-hidden="true"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardHead}>
            <Skeleton circle width={40} height={40} />
            <Skeleton width={100} height={14} radius={6} />
          </div>
          <div className={styles.cardBody}>
            <Skeleton width="90%" height={12} radius={6} />
            <Skeleton width="70%" height={12} radius={6} />
            <Skeleton width="82%" height={12} radius={6} />
          </div>
        </div>
      ))}
    </div>
  );
}