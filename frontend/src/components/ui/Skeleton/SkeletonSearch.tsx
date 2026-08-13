import Skeleton from "./Skeleton";
import styles from "./blocks.module.css";

export default function SkeletonSearch({ height = 44 }: { height?: number }) {
  return (
    <div className={styles.search} style={{ height }} role="presentation" aria-hidden="true">
      <Skeleton circle width={18} height={18} />
      <Skeleton width={180} height={12} radius={6} />
      <Skeleton width={90} height={30} radius={8} className={styles.searchPill} />
    </div>
  );
}