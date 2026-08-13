import { Reveal } from "@/components/motion";
import styles from "./ResearchPipeline.module.css";

import PipelineCanvas from "./layout/PipelineCanvas";

export default function ResearchPipeline() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.header}>
          <span className={styles.badge}>MACHINE LEARNING PIPELINE</span>
          <h2 className={styles.title}>Research Pipeline</h2>
          <p className={styles.subtitle}>
            End-to-end workflow followed to develop the CardioInsight AI
            cardiovascular disease prediction system.
          </p>
        </div>
      </Reveal>

      <div className={styles.pipelineCard}>
        <PipelineCanvas />
      </div>
    </section>
  );
}