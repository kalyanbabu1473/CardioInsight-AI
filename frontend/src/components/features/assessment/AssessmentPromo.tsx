import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

import styles from "./AssessmentPromo.module.css";

interface AssessmentPromoProps {
  /** banner = horizontal top-of-page card, placeholder = centered empty state. */
  variant?: "banner" | "placeholder";
  icon?: LucideIcon;
  title: string;
  message: string;
  /** Button label, e.g. "Start Assessment". Defaults to "Start Assessment". */
  buttonLabel?: string;
  /** For inline "disabled feature" prompts, show a lock + tooltip semantics. */
  locked?: boolean;
  className?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function AssessmentPromo({
  variant = "placeholder",
  icon: Icon = Activity,
  title,
  message,
  buttonLabel = "Start Assessment",
  locked = false,
  className,
}: AssessmentPromoProps) {
  const rootClass =
    variant === "banner" ? styles.banner : styles.compactCard;

  return (
    <motion.section
      className={`${rootClass} ${className ?? ""}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <div className={styles.iconWrap}>
        {locked ? <Lock size={22} /> : <Icon size={22} />}
      </div>

      <div className={styles.copy}>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>

      <Link to="/assessment" className={styles.actionLink}>
        <Button variant="primary" size="md">
          {buttonLabel}
          <ArrowRight size={16} />
        </Button>
      </Link>
    </motion.section>
  );
}