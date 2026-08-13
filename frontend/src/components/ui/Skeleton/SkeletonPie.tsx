import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export default function SkeletonPie({ size = 180 }: { size?: number }) {
  return (
    <div className={styles.pieWrap} role="presentation" aria-hidden="true">
      <Skeleton circle width={size} height={size} />
      <div className={styles.legend}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.legendRow}>
            <Skeleton circle width={12} height={12} />
            <Skeleton width={110} height={10} radius={5} />
          </div>
        ))}
      </div>
    </div>
  );
}