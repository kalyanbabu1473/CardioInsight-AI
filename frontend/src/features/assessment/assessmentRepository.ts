/**
 * Assessment repository — the persistence boundary for assessments.
 *
 * Backed by the CardioInsight persistence API. The risk prediction runs on the
 * backend against the deployed Random Forest (`POST /api/predict`); the JSON
 * returned here carries the authoritative model output including exact SHAP
 * attributions. There is no local heuristic model — if the ML service is
 * unreachable the assessment is refused rather than approximated.
 */

import { FEATURES, getFeature } from "@/data/assessment/featureContract";

import type { AssessmentResult } from "./assessmentResult";
import {
  type AssessmentInput,
  type Contribution,
  type RecommendationCategories,
  type RiskLevel,
  type RiskResult,
  formatFeatureValue,
  featureValue,
} from "./assessmentService";
import {
  apiCreateAssessment,
  apiGetAssessment,
  apiGetLatestAssessment,
  apiListAssessments,
  apiPredict,
  type BackendPrediction,
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
 * Routes a backend-returned SHAP attribution vector into the result's
 * "top factors" list. Each factor carries the human label, the patient's value
 * for that feature, and the exact TreeSHAP contribution (model-authoritative).
 */
function topFactorsFromBackend(
  input: AssessmentInput,
  prediction: BackendPrediction,
): Contribution[] {
  return prediction.contributions
    .slice(0, 6)
    .map(({ feature, contribution }) => {
      const spec = getFeature(feature);
      const value = featureValue(input, spec);
      return {
        name: spec.label,
        value: formatFeatureValue(spec, value),
        contribution,
      };
    });
}

function buildInterpretation(level: RiskLevel, topFactors: Contribution[]): string {
  const drivers = topFactors
    .filter((f) => f.contribution > 0)
    .map((f) => f.name)
    .slice(0, 3);

  if (level === "Low") {
    return "Low predicted cardiovascular risk. No dominant risk drivers were identified; continuing a healthy lifestyle and routine monitoring is recommended.";
  }
  if (level === "Moderate") {
    return `Moderate predicted cardiovascular risk. Notable contributions from ${drivers.join(", ")} suggest modifiable factors that could meaningfully reduce risk.`;
  }
  return `High predicted cardiovascular risk. The strongest drivers are ${drivers.join(", ")}. Prompt clinical assessment and active risk modification are strongly recommended.`;
}

function buildRecommendations(
  input: AssessmentInput,
  level: RiskLevel,
): RecommendationCategories {
  const lifestyle: string[] = [];
  const monitoring: string[] = [];
  const medical: string[] = [];

  const { bloodPressure, metabolic, lipids, lifestyle: life, bodyComposition, environmentalToxins, medicalHistory } = input;

  if (life.currentSmoking !== "Not at all") {
    lifestyle.push("Enroll in a structured smoking cessation program and set a quit date.");
  }
  if (life.workedOutsideHome7d === "Yes") {
    lifestyle.push("Avoid environments with secondhand smoke exposure where possible.");
  }
  if (life.alcoholicDrinksPerDay > 2) {
    lifestyle.push("Consider moderating alcohol intake to no more than 1–2 drinks per day.");
  }
  if (life.dailySittingMinutes >= 480) {
    lifestyle.push("Break up prolonged sitting with short standing breaks throughout the day.");
  }
  if (life.dailySittingMinutes >= 60) {
    lifestyle.push("Aim for at least 150 minutes of moderate aerobic activity per week.");
  }

  const bmi = calculateBmiFromInput(bodyComposition);
  if (bmi > 25) {
    lifestyle.push(
      `Target gradual weight reduction toward a BMI < 25 (current ${bmi.toFixed(1)} kg/m²) through diet and activity.`,
    );
  }
  if (bodyComposition.waistCm > 88) {
    lifestyle.push("Prioritize reduction of central adiposity; a balanced Mediterranean-style diet is recommended.");
  }
  if (life.dietaryCaffeineMg >= 400) {
    lifestyle.push("Consider moderating daily caffeine intake to below 400 mg/day.");
  }

  const sys = Math.max(bloodPressure.systolicBP1, bloodPressure.systolicBP2, bloodPressure.systolicBP3);
  if (sys >= 130) {
    monitoring.push("Monitor blood pressure twice weekly and maintain a home BP diary.");
  } else {
    monitoring.push("Recheck blood pressure annually at routine visits.");
  }

  if (metabolic.hba1c >= 6.5 || metabolic.fastingGlucose >= 126) {
    monitoring.push("Confirm glycemic status with a fasting glucose or oral glucose tolerance test.");
  } else if (metabolic.hba1c >= 5.7 || metabolic.fastingGlucose >= 100) {
    monitoring.push("Monitor HbA1c and fasting glucose every 6 months given prediabetic range.");
  }

  if (lipids.totalCholesterol >= 200 || lipids.ldlCholesterol >= 130) {
    monitoring.push("Repeat a full lipid panel within 3 months to confirm trend.");
  } else {
    monitoring.push("Repeat lipid panel every 1–2 years per cardiovascular screening guidance.");
  }
  monitoring.push("Reassess overall cardiovascular risk annually.");

  if (bloodPressure.hypertensionDiagnosis === "Yes" || sys >= 140) {
    medical.push("Review antihypertensive therapy and target blood pressure < 130/80 mmHg.");
  }
  if (metabolic.hba1c >= 6.5) {
    medical.push("Discuss diabetes management and initiate or escalate glycemic therapy as appropriate.");
  }
  if (lipids.ldlCholesterol >= 160 || medicalHistory.cholesterolMedication === "Yes") {
    medical.push("Discuss statin therapy and lipid-lowering goals with the treating clinician.");
  }
  if (lipids.triglycerides >= 500) {
    medical.push("Assess for secondary causes of hypertriglyceridemia and consider fibrate therapy.");
  }
  if (environmentalToxins.bloodLead >= 5 || environmentalToxins.bloodCadmium >= 1.0) {
    medical.push("Elevated heavy-metal burden — consider occupational/environmental exposure assessment.");
  }
  if (level === "High") {
    medical.push("Refer for specialist cardiology review for comprehensive risk stratification.");
    medical.push("Discuss aspirin or antithrombotic prophylaxis based on bleeding-risk assessment.");
  } else if (level === "Moderate") {
    medical.push("Schedule a follow-up consultation within 3 months to review modifiable risk factors.");
  } else {
    medical.push("Continue routine preventive care and lifestyle counseling.");
  }

  return {
    lifestyle: lifestyle.length > 0 ? lifestyle : ["Maintain a balanced diet, regular exercise, and adequate sleep."],
    monitoring,
    medical,
  };
}

function calculateBmiFromInput(bodyComposition: { heightCm: number; weightKg: number }): number {
  if (!bodyComposition.heightCm || !bodyComposition.weightKg) return 0;
  const meters = bodyComposition.heightCm / 100;
  return bodyComposition.weightKg / (meters * meters);
}

/**
 * Runs the assessment: asks the backend ML service for the authoritative
 * prediction (including SHAP attributions), then persists the record. No
 * offline fallback — a prediction is only ever produced by the model.
 */
export async function createAssessment(
  input: AssessmentInput,
): Promise<AssessmentResult> {
  const backend = await apiPredict(input);
  const topFactors = topFactorsFromBackend(input, backend);
  const result: RiskResult = {
    probability: backend.probability,
    level: backend.level,
    confidence: backend.confidence,
    interpretation: buildInterpretation(backend.level, topFactors),
    topFactors,
    recommendations: buildRecommendations(input, backend.level),
  };
  return apiCreateAssessment({
    model: backend.model,
    modelTagline: "Production Model",
    input,
    result,
  });
}

export { FEATURES };