import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export interface SkeletonTimelineProps {
  items?: number;
}

export default function SkeletonTimeline({ items = 5 }: SkeletonTimelineProps) {
  return (
    <div className={styles.timeline} role="presentation" aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={styles.timelineItem}>
          <Skeleton circle width={20} height={20} className={styles.timelineDot} />
          <div className={styles.timelineBody}>
            <Skeleton width="55%" height={13} radius={6} />
            <Skeleton width="85%" height={11} radius={6} />
          </div>
        </div>
      ))}
    </div>
  );
}