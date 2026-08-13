import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import PageSkeleton, { type PageVariant } from "./PageSkeleton";

import styles from "./SkeletonPage.module.css";

const LOAD_MS = 700;
const FADE = 0.3;

export interface SkeletonPageProps {
  variant: PageVariant;
  /**
   * Genuine async-ready flag. When provided, the skeleton stays visible until
   * real data has finished loading (`loading === false`). Omit this to just use
   * the short minimum delay (for fully static pages).
   */
  loading?: boolean;
  /** Minimum time to show the skeleton before revealing content. */
  minLoadMs?: number;
  children: ReactNode;
}

/**
 * Premium global loader. Shows a shimmering skeleton shaped like the target
 * page, then cross-fades the real content in once ready. No layout jump
 * because the skeleton mirrors the page layout.
 *
 * `loading` ties the skeleton to genuine async readiness (used on data-driven
 * pages like Reports + Assessment). Static pages use a short minimum delay so
 * there is never a flash of empty space.
 */
export default function SkeletonPage({
  variant,
  loading,
  minLoadMs = LOAD_MS,
  children,
}: SkeletonPageProps) {
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minLoadMs);
    return () => clearTimeout(t);
  }, [minLoadMs]);

  const ready = minElapsed && (loading === undefined || loading === false);

  return (
    <div className={styles.root}>
      <AnimatePresence mode="wait" initial={false}>
        {!ready ? (
          <motion.div
            key="skeleton"
            className={styles.skeletonLayer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: FADE } }}
            transition={{ duration: 0.2 }}
            aria-busy="true"
            aria-live="polite"
          >
            <PageSkeleton variant={variant} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className={styles.contentLayer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: FADE } }}
            exit={{ opacity: 0, transition: { duration: FADE } }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}