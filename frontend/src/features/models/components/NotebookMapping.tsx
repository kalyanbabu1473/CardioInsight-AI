import { motion } from "framer-motion";
import { NotebookPen } from "lucide-react";

import { notebooks } from "../modelsData";

import styles from "./NotebookMapping.module.css";

export default function NotebookMapping() {
  return (
    <div className={styles.list}>
      {notebooks.map((notebook, index) => (
        <motion.div
          key={notebook.id}
          className={styles.card}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ x: 4 }}
        >
          <div className={styles.timeline}>
            <span className={styles.dot} />
            {index < notebooks.length - 1 && <span className={styles.line} />}
          </div>
          <div className={styles.cardBody}>
            <div className={styles.cardHead}>
              <span className={styles.id}>Notebook {notebook.id}</span>
              <span className={styles.cardIcon}>
                <NotebookPen size={16} />
              </span>
            </div>
            <h4>{notebook.title}</h4>
            <p>{notebook.role}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}