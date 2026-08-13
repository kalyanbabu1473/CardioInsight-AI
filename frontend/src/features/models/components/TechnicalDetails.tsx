import { motion } from "framer-motion";
import { Code2, Cpu, Gauge, GitBranch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { technicalDetails } from "../modelsData";

import styles from "./TechnicalDetails.module.css";

const icons: LucideIcon[] = [Code2, Gauge, Cpu, GitBranch];

export default function TechnicalDetails() {
  return (
    <div className={styles.wrap}>
      {technicalDetails.map((block, index) => {
        const Icon = icons[index % icons.length];
        return (
          <motion.section
            key={block.title}
            className={styles.block}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <header className={styles.blockHead}>
              <span className={styles.blockIcon}>
                <Icon size={18} />
              </span>
              <h3>{block.title}</h3>
            </header>

            <div className={styles.table}>
              {block.rows.map((row) => (
                <div key={row[0]} className={styles.row}>
                  <span className={styles.key}>{row[0]}</span>
                  <span className={styles.value}>{row[1]}</span>
                </div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}