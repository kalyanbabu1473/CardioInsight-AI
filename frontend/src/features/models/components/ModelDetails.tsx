import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

import { models } from "../modelsData";

import styles from "./ModelDetails.module.css";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.block}>
      <h5>{title}</h5>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ModelDetails() {
  const [open, setOpen] = useState<string>("random-forest");

  const toggle = (id: string) => {
    setOpen((current) => (current === id ? "" : id));
  };

  return (
    <div className={styles.list}>
      {models.map((model) => {
        const isOpen = open === model.id;
        return (
          <motion.div
            key={model.id}
            className={clsx(styles.card, isOpen && styles.cardOpen)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4 }}
          >
            <button
              type="button"
              className={styles.toggle}
              onClick={() => toggle(model.id)}
              aria-expanded={isOpen}
            >
              <div className={styles.toggleLeft}>
                <span className={styles.modelName}>{model.name}</span>
                <span className={styles.modelTag}>{model.tagline}</span>
              </div>
              <motion.span
                className={styles.chevron}
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={18} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className={styles.body}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className={styles.bodyInner}>
                    <p className={styles.overview}>{model.explanation}</p>

                    <div className={styles.grid}>
                      <Section
                        title="Training workflow"
                        items={[
                          `Load ${model.preprocessing[0].toLowerCase()}`,
                          ...model.preprocessing.slice(1),
                        ]}
                      />
                      <Section
                        title="Hyperparameters"
                        items={model.hyperparams.map(
                          (h) => `${h.label} = ${h.value}`,
                        )}
                      />
                    </div>

                    <div className={styles.grid}>
                      <Section title="Advantages" items={model.advantages} />
                      <Section title="Disadvantages" items={model.limitations} />
                    </div>

                    <div className={styles.recommend}>
                      <strong>When this model is recommended:</strong>{" "}
                      {model.bestUseCase}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}