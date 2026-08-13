import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export default function SkeletonTable({ rows = 9, cols = 4 }: SkeletonTableProps) {
  return (
    <div className={styles.table} role="presentation" aria-hidden="true">
      <div className={styles.thead}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} radius={6} className={styles.th} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tr}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              height={12}
              radius={6}
              width={c === 0 ? "70%" : "100%"}
              className={styles.td}
            />
          ))}
        </div>
      ))}
    </div>
  );
}