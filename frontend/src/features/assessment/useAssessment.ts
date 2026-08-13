/**
 * useAssessment — the shared assessment context value + hook. The provider
 * component lives in AssessmentProvider.tsx; keeping the hook in its own file
 * follows the project's fast-refresh convention (see app/useTheme.ts).
 */

import { createContext, useContext } from "react";

import type { AssessmentResult } from "./assessmentResult";
import type { AssessmentInput } from "./assessmentService";

export interface AssessmentContextValue {
  /** The assessment currently displayed on the Reports page (any history item). */
  current: AssessmentResult | null;
  /**
   * The most recent assessment successfully completed from the Assessment page
   * during this session. This is the ONLY report available for printing — it is
   * intentionally kept separate from `current` so selecting an old history
   * entry for viewing never changes the printable report. Backend-ready: can be
   * sourced from `GET /assessments/latest` later.
   */
  latestAssessment: AssessmentResult | null;
  /** Full history of completed assessments (newest first). */
  history: AssessmentResult[];
  /**
   * True once the user has completed at least one assessment this session.
   * Drives the app-wide onboarding flow: until true, dependent pages show
   * prompts and gated features stay locked.
   */
  hasAssessment: boolean;
  /**
   * True once the user has completed an assessment during the current session
   * (regardless of persisted history). Drives the "highlight me" attention
   * state on the Assessment link, which should pulse until a real report has
   * been generated in the session rather than merely existing in the database.
   */
  hasSessionAssessment: boolean;
  isLoading: boolean;
  /** Runs an assessment via the repository and makes it current + latest. */
  submitAssessment: (input: AssessmentInput) => Promise<AssessmentResult>;
  /** Loads a specific report from history by id (viewing only). */
  selectAssessment: (id: string) => Promise<void>;
  /** Clears the selected report (e.g. when starting a new assessment). */
  clearCurrent: () => void;
}

export const AssessmentContext =
  createContext<AssessmentContextValue | null>(null);

export function useAssessment(): AssessmentContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) {
    throw new Error("useAssessment must be used within an AssessmentProvider");
  }
  return ctx;
}