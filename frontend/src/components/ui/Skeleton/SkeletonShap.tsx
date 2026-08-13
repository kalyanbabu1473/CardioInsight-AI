import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export default function SkeletonShap() {
  return (
    <div className={styles.shap} role="presentation" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.shapRow}>
          <Skeleton width={90} height={12} radius={6} />
          <div className={styles.shapDiverging}>
            <div className={styles.shapLeft}>
              <Skeleton
                height={14}
                radius={6}
                width={`${30 + ((i * 11) % 55)}%`}
                className={styles.shapLeftFill}
              />
            </div>
            <div className={styles.shapRight}>
              <Skeleton height={14} radius={6} width={`${25 + ((i * 7) % 45)}%`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}