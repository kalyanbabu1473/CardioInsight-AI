import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

import styles from "./LockedFeature.module.css";

interface LockedFeatureProps {
  locked: boolean;
  /** Children render dimmed + non-interactive behind the lock overlay. */
  children: ReactNode;
}

/**
 * Wraps an assessment-dependent section. When `locked`, the content stays in
 * place but is dimmed and non-interactive, overlaid with a lock icon whose
 * tooltip explains how to unlock it, plus a small CTA back to Assessment.
 */
export default function LockedFeature({ locked, children }: LockedFeatureProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className={styles.wrap}>
      <div className={styles.dimmed} aria-hidden={true}>
        {children}
      </div>

      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        role="status"
      >
        <span className={styles.lock} data-lock-tip>
          <Lock size={20} />
          <span className={styles.tip} role="tooltip">
            Complete an Assessment to unlock this feature.
          </span>
        </span>
        <Link to="/assessment" className={styles.cta}>
          <Button variant="primary" size="sm">
            Start Assessment
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}