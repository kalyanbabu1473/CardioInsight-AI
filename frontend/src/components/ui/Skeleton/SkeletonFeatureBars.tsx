import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export interface SkeletonFeatureBarsProps {
  rows?: number;
}

export default function SkeletonFeatureBars({ rows = 6 }: SkeletonFeatureBarsProps) {
  return (
    <div className={styles.featureBars} role="presentation" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.featureRow}>
          <Skeleton width={90} height={12} radius={6} />
          <div className={styles.featureTrack}>
            <Skeleton
              height={10}
              radius={5}
              className={styles.featureFill}
              style={{ width: `${20 + ((i * 13) % 70)}%` }}
            />
          </div>
          <Skeleton width={40} height={11} radius={6} />
        </div>
      ))}
    </div>
  );
}