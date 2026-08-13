import { Brain } from "lucide-react";

import ModelCard from "./ModelCard";
import { modelCards } from "../pipelineData";

import styles from "./ModelDevelopment.module.css";

export default function ModelDevelopment() {
  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Brain className={styles.icon} strokeWidth={2} />
        </div>

        <span className={styles.phase}>PHASE 03</span>

        <h2 className={styles.title}>Machine Learning Model Development</h2>

        <p className={styles.description}>
          Multiple supervised learning algorithms were developed, compared and
          optimized to identify the best-performing cardiovascular disease
          prediction model.
        </p>
      </div>

      <div className={styles.models}>
        {modelCards.map((model) => (
          <ModelCard
            key={model.notebook}
            title={model.title}
            notebook={model.notebook}
            color={model.color}
            icon={model.icon}
          />
        ))}
      </div>
    </section>
  );
}