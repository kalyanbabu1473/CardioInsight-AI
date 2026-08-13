import { motion } from "framer-motion";

import { pipelineSteps } from "../modelsData";

import styles from "./Pipeline.module.css";

export default function Pipeline() {
  return (
    <div className={styles.wrap}>
      <div className={styles.rail}>
        {pipelineSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={`${step.title}-${index}`} className={styles.item}>
              <motion.div
                className={styles.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.node}>
                  <motion.div
                    className={styles.icon}
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.24,
                    }}
                  >
                    <Icon size={20} />
                  </motion.div>
                  <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <span className={styles.title}>{step.title}</span>
                <span className={styles.detail}>{step.detail}</span>
              </motion.div>

              {index < pipelineSteps.length - 1 && (
                <motion.span
                  className={styles.arrow}
                  aria-hidden="true"
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: index * 0.08 + 0.1 }}
                >
                  <motion.span
                    className={styles.arrowInner}
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.24,
                    }}
                  >
                    →
                  </motion.span>
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}