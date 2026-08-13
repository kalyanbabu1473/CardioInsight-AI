import {
  X,
  Database,
  Tag,
  CircleCheck,
  FileSearch,
} from "lucide-react";

import styles from "./FeatureDetails.module.css";
import type { Variable } from "../../types/variable";

interface Props {
  variable: Variable | null;
  onClose: () => void;
}

export default function FeatureDetails({
  variable,
  onClose,
}: Props) {
  if (!variable) return null;

  return (
    <div className={styles.overlay}>
      <aside className={styles.drawer}>
        <div className={styles.header}>
          <div>
            <h2>Feature Details</h2>
            <p>Selected ML Feature</p>
          </div>

          <button
            className={styles.closeButton}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>

        <div className={styles.hero}>
          <h1>{variable.name}</h1>
          <p>{variable.description}</p>
        </div>

        <div className={styles.card}>
          <Database size={18} />
          <div>
            <span>Dataset</span>
            <strong>NHANES 2017–2020</strong>
          </div>
        </div>

        <div className={styles.card}>
          <Tag size={18} />
          <div>
            <span>Domain</span>
            <strong>{variable.domain}</strong>
          </div>
        </div>

        <div className={styles.card}>
          <CircleCheck size={18} />
          <div>
            <span>Status</span>
            <strong className={styles.success}>
              Selected Feature
            </strong>
          </div>
        </div>

        <div className={styles.card}>
          <FileSearch size={18} />
          <div>
            <span>Description</span>
            <p>{variable.description}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}