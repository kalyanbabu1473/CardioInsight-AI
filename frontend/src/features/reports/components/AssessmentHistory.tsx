import { motion } from "framer-motion";
import clsx from "clsx";
import {
  ChevronDown,
  FileText,
  History,
  Loader2,
  Printer,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui";
import type { AssessmentResult } from "@/features/assessment/assessmentResult";
import { formatDateTime } from "../reportService";

import styles from "./AssessmentHistory.module.css";

interface AssessmentHistoryProps {
  history: AssessmentResult[];
  current: AssessmentResult | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  /** Prints the currently selected report (falls back to the latest available). */
  onPrintLatest: () => void;
  /** Whether a print/export is currently being prepared. */
  isPrinting?: boolean;
}

export default function AssessmentHistory({
  history,
  current,
  isLoading,
  onSelect,
  onPrintLatest,
  isPrinting = false,
}: AssessmentHistoryProps) {
  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <History size={17} />
        </div>
        <div>
          <h3>Assessment History</h3>
          <p>{history.length} report{history.length === 1 ? "" : "s"} archived</p>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.state}>
          <Loader2 className={styles.spin} size={18} />
          <span>Loading reports…</span>
        </div>
      ) : history.length === 0 ? (
        <div className={styles.state}>
          <FileText size={18} />
          <span>No reports yet. Run an assessment to generate one.</span>
        </div>
      ) : (
        <ul className={styles.list}>
          {history.map((assessment, index) => {
            const active = current?.id === assessment.id;
            return (
              <motion.li
                key={assessment.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <button
                  type="button"
                  className={clsx(styles.item, active && styles.itemActive)}
                  onClick={() => onSelect(assessment.id)}
                >
                  <span className={styles.risk}>{assessment.result.level}</span>
                  <span className={styles.body}>
                    <span className={styles.id}>{assessment.id}</span>
                    <span className={styles.date}>
                      {formatDateTime(assessment.createdAt)}
                    </span>
                    <span className={styles.prob}>
                      Risk {(assessment.result.probability * 100).toFixed(1)}%
                    </span>
                    <span className={styles.model}>
                      <Sparkles size={11} />
                      {assessment.model}
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}

      {history.length > 3 && (
        <p className={styles.scrollHint}>
          <ChevronDown size={13} />
          Scroll for older reports
        </p>
      )}

      <div className={styles.printFooter}>
        <Button
          variant="primary"
          size="lg"
          className={styles.printButton}
          onClick={onPrintLatest}
          disabled={isPrinting}
        >
          {isPrinting ? (
            <Loader2 size={16} className={styles.spin} />
          ) : (
            <Printer size={16} />
          )}
          {isPrinting ? "Preparing…" : "Print Report"}
        </Button>
      </div>
    </aside>
  );
}