import { ChevronRight } from "lucide-react";
import styles from "./ConnectorLayer.module.css";

export default function ConnectorLayer() {
  return (
    <div className={styles.connector} aria-hidden="true">
      <span className={styles.line} />
      <span className={styles.chevron}>
        <ChevronRight size={16} strokeWidth={2.4} />
      </span>
    </div>
  );
}