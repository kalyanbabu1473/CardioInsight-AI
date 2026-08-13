/**
 * AssessmentResult — the persisted record produced when a clinician runs an
 * assessment. Combines the raw patient input with the risk engine output plus
 * bookkeeping metadata (id, timestamp, model) so a report can be rendered and
 * re-rendered at any time without re-running inference.
 */

import type { AssessmentInput, RiskResult } from "./assessmentService";

export interface AssessmentResult {
  /** Stable, backend-friendly identifier, e.g. CI-20260805-0001. */
  id: string;
  /** ISO-8601 timestamp of when the assessment was completed. */
  createdAt: string;
  model: string;
  modelTagline: string;
  input: AssessmentInput;
  result: RiskResult;
  /**
   * True when a record was created by an older 20-feature build of the app
   * (flat input shape, sex/race/biomarkers present). Reports render these with
   * a legacy badge instead of the current 44-feature layout.
   */
  legacy?: boolean;
}