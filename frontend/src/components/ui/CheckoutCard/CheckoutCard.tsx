import { motion } from "framer-motion";
import { ChevronRight, HeartPulse } from "lucide-react";

import styles from "./CheckoutCard.module.css";

const heartbeat = {
  duration: 2.6,
  repeat: Infinity,
  ease: "easeInOut",
} as const;

export default function CheckoutCard() {
  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.span
        className={styles.text}
        animate={{ scale: [1, 1.08, 1, 1.08, 1] }}
        transition={heartbeat}
      >
        <HeartPulse
          className={styles.icon}
          size={15}
          strokeWidth={2.5}
        />
        CHECK OUT
      </motion.span>

      <motion.span
        className={styles.arrow}
        animate={{ x: [0, 6, 0] }}
        transition={heartbeat}
      >
        <ChevronRight size={18} />
      </motion.span>
    </motion.div>
  );
}