import { motion } from "framer-motion";

import { SkeletonText, SkeletonBars, SkeletonCircle } from "@/components/ui/Skeleton";

import styles from "./RunLoading.module.css";

/**
 * Genuine "running the model" screen shown while an assessment is actually
 * computing (driven by the async submit promise). Mirrors the report so the
 * transition to /reports has no layout jump.
 */
export default function RunLoading() {
  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <SkeletonText lines={1} widths={["46%"]} className={styles.title} />
          <SkeletonText lines={2} widths={["82%", "60%"]} />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <SkeletonCircle size={34} />
          <SkeletonText lines={3} widths={["90%", "80%", "70%"]} />
        </div>
        <div className={styles.panel}>
          <SkeletonBars bars={7} maxHeight={120} minHeight={30} />
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footRow}>
          <SkeletonCircle size={16} />
          <SkeletonText lines={1} widths={["60%"]} />
        </div>
        <p className={styles.hint}>Running Random Forest risk model…</p>
      </div>
    </motion.div>
  );
}