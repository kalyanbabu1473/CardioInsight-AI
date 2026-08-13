import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export interface SkeletonBarsProps {
  bars?: number;
  maxHeight?: number;
  minHeight?: number;
}

export default function SkeletonBars({
  bars = 12,
  maxHeight = 160,
  minHeight = 40,
}: SkeletonBarsProps) {
  return (
    <div className={styles.bars} role="presentation" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => {
        const h = minHeight + ((i * 37 + 11) % (maxHeight - minHeight));
        return (
          <Skeleton
            key={i}
            width="100%"
            height={h}
            radius={6}
            className={styles.bar}
          />
        );
      })}
    </div>
  );
}