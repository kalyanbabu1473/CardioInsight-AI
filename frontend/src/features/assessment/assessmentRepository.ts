/**
 * Assessment repository - the persistence boundary for assessments.
 *
 * The backend computes the authoritative prediction, calibrated risk level,
 * SHAP-derived top factors, interpretation, and recommendations from validated
 * input. This client never posts a locally computed result; it only stores and
 * retrieves server-created records. If the ML service is unreachable the
 * assessment is refused rather than approximated.
 */

import type { AssessmentResult } from "./assessmentResult";
import type { AssessmentInput } from "./assessmentService";
import {
  apiCreateAssessment,
  apiGetAssessment,
  apiGetLatestAssessment,
  apiListAssessments,
} from "@/services/api/assessmentApi";

export async function listAssessments(): Promise<AssessmentResult[]> {
  return apiListAssessments();
}

export async function getAssessment(id: string): Promise<AssessmentResult | null> {
  return apiGetAssessment(id);
}

export async function getLatestAssessment(): Promise<AssessmentResult | null> {
  return apiGetLatestAssessment();
}

/**
 * Creates an assessment on the server. Only the clinical input is sent; the
 * server returns the authoritative result and display fields.
 */
export async function createAssessment(
  input: AssessmentInput,
): Promise<AssessmentResult> {
  return apiCreateAssessment({ input });
}
