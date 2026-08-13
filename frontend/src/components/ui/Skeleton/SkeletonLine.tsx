import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export default function SkeletonLine({
  segments = 4,
  height = 200,
}: {
  segments?: number;
  height?: number;
}) {
  return (
    <div
      className={styles.line}
      style={{ height }}
      role="presentation"
      aria-hidden="true"
    >
      {Array.from({ length: segments }).map((_, i) => (
        <Skeleton key={i} height={14} radius={7} className={styles.lineSeg} />
      ))}
    </div>
  );
}