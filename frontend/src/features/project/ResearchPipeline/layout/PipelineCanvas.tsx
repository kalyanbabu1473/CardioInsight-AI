import styles from "./PipelineCanvas.module.css";

import SideCard from "../components/SideCard";
import StageCard from "../components/StageCard";
import ModelDevelopment from "../components/ModelDevelopment";
import ConnectorLayer from "../connectors/ConnectorLayer";

import {
  leftCards,
  outputCards,
  stageCards,
} from "../pipelineData";

export default function PipelineCanvas() {
  return (
    <section className={styles.canvas}>
      {/* Row 1 — Dataset foundations */}
      <div className={styles.row}>
        <SideCard {...leftCards[0]} />
        <ConnectorLayer />
        <StageCard {...stageCards[0]} />
        <ConnectorLayer />
        <SideCard {...outputCards[0]} />
      </div>

      {/* Row 2 — Target + preparation */}
      <div className={styles.row}>
        <SideCard {...leftCards[1]} />
        <ConnectorLayer />
        <StageCard {...stageCards[1]} />
        <ConnectorLayer />
        <SideCard {...outputCards[1]} />
      </div>

      {/* Row 3 — Model development (hero) */}
      <div className={`${styles.row} ${styles.modelRow}`}>
        <SideCard {...leftCards[2]} />
        <ConnectorLayer />
        <ModelDevelopment />
        <ConnectorLayer />
        <SideCard {...outputCards[2]} />
      </div>

      {/* Row 4 — Evaluation */}
      <div className={styles.row}>
        <SideCard {...leftCards[3]} />
        <ConnectorLayer />
        <StageCard {...stageCards[2]} />
        <ConnectorLayer />
        <SideCard {...outputCards[3]} />
      </div>

      {/* Row 5 — Validation + deployment */}
      <div className={styles.row}>
        <SideCard {...leftCards[4]} />
        <ConnectorLayer />
        <StageCard {...stageCards[3]} />
        <ConnectorLayer />
        <SideCard {...outputCards[4]} />
      </div>
    </section>
  );
}