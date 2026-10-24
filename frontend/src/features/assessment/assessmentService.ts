/**
 * Assessment domain logic - pure, framework-free functions that power the
 * guided clinical wizard and the risk result model. Kept separate from React so
 * the same contract can be reused by the backend inference call.
 *
 * The intake is contract-driven: every input maps 1:1 to one of the 18 clinical
 * features the production Random Forest was trained on (see the feature
 * contract at `/data/assessment/featureContract.generated.ts`, generated from
 * `feature_contract.json`). There is no heuristic risk model on the frontend -
 * all probability / level / confidence / SHAP attribution authority lives on
 * the backend ML service.
 */

import {
  CATEGORY_LABELS,
  FEATURES,
  getFeature,
  type CategoryKey,
  type FeatureSpec,
} from "@/data/assessment/featureContract";

export type BinaryOption = "Yes" | "No";
export type SexOption = "Male" | "Female";
export type SmokingStatusOption = "Every day" | "Some days" | "Not at all";

export interface DemographicsInput {
  age: number;
  sex: SexOption;
}

export interface BodyCompositionInput {
  weightKg: number;
  heightCm: number;
  waistCm: number;
}

export interface BloodPressureInput {
  systolicBP: number;
  diastolicBP: number;
  hypertensionDiagnosis: BinaryOption;
}

export interface MetabolicInput {
  hba1c: number;
  fastingGlucose: number;
  insulin: number;
}

export interface LipidsInput {
  totalCholesterol: number;
  ldlCholesterol: number;
  hdlCholesterol: number;
  triglycerides: number;
}

export interface LifestyleInput {
  everSmoked100: BinaryOption;
  currentSmoking: SmokingStatusOption;
}

/** The complete clinical intake - all 18 model features across 6 sections. */
export interface AssessmentInput {
  demographics: DemographicsInput;
  bodyComposition: BodyCompositionInput;
  bloodPressure: BloodPressureInput;
  metabolic: MetabolicInput;
  lipids: LipidsInput;
  lifestyle: LifestyleInput;
}

export type RiskLevel = "Low" | "Moderate" | "High";

export interface Contribution {
  name: string;
  value: string;
  contribution: number;
}

export interface RecommendationCategories {
  lifestyle: string[];
  monitoring: string[];
  medical: string[];
}

export interface RiskResult {
  probability: number;
  level: RiskLevel;
  /** Prediction certainty as a 0-100 percentage. */
  confidence: number;
  interpretation: string;
  topFactors: Contribution[];
  recommendations: RecommendationCategories;
}

export type StepErrors = Record<string, string>;

export const PREDICTION_MODEL = {
  name: "Random Forest (Clinical CVD - 18 features)",
  tagline: "Calibrated Clinical Model",
  description:
    "Calibrated ensemble of decision trees trained on the NHANES clinical dataset using 18 routinely collectable cardiovascular risk features across the 6-section assessment.",
};

export const STEP_COUNT = 7;

export const stepLabel = (step: number): string => {
  const category = WIZARD_STEP_CATEGORY[step];
  return category ? CATEGORY_LABELS[category] : "Review";
};

export const stepDescription = (step: number): string => {
  switch (stepLabel(step)) {
    case "Demographics":
      return "Demographic baseline";
    case "Body Composition":
      return "Anthropometric data";
    case "Blood Pressure & History":
      return "Hemodynamic status";
    case "Metabolic Panel":
      return "Glucose and insulin panel";
    case "Lipid Panel":
      return "Cholesterol panel";
    case "Lifestyle":
      return "Behavioral risk factors";
    default:
      return "Confirm patient record";
  }
};

/** Maps a 1-indexed wizard step to a contract category (Review is not present). */
export const WIZARD_STEP_CATEGORY: Partial<Record<number, CategoryKey>> = {
  1: "demographics",
  2: "bodyComposition",
  3: "bloodPressure",
  4: "metabolic",
  5: "lipids",
  6: "lifestyle",
};

/** Reads the value for a feature from an assessment input by its dot-path. */
export function featureValue(
  input: AssessmentInput,
  feature: FeatureSpec,
): number | BinaryOption | SexOption | SmokingStatusOption {
  if (feature.derived && feature.name === "BMXBMI") {
    return calculateBmi(
      input.bodyComposition.heightCm,
      input.bodyComposition.weightKg,
    );
  }
  const [section, field] = feature.field.split(".");
  const sectionValue = (
    input[section as keyof AssessmentInput] as unknown as Record<string, unknown>
  );
  return sectionValue?.[field] as
    | number
    | BinaryOption
    | SexOption
    | SmokingStatusOption;
}

/** Human-readable display for a feature value (units / decoded Yes-No). */
export function formatFeatureValue(
  feature: FeatureSpec,
  value: number | string,
): string {
  if (typeof value === "string") return value;
  if (feature.type === "categorical") {
    const label = Object.entries(feature.encode ?? {}).find(
      ([, code]) => code === value,
    )?.[0];
    return label ?? String(value);
  }
  if (feature.display) {
    const converted = Number(value) / feature.display.factor;
    return `${converted.toFixed(1)} ${feature.display.unit}`;
  }
  return feature.unit ? `${value} ${feature.unit}` : String(value);
}

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";

export function calculateBmi(heightCm: number, weightKg: number): number {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return 0;
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const meters = heightCm / 100;
  return Math.round((weightKg / (meters * meters)) * 10000) / 10000;
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi <= 0) return "Normal";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function createInitialInput(): AssessmentInput {
  return {
    demographics: { age: 0, sex: "Female" },
    bodyComposition: { weightKg: 0, heightCm: 0, waistCm: 0 },
    bloodPressure: {
      systolicBP: 0,
      diastolicBP: 0,
      hypertensionDiagnosis: "No",
    },
    metabolic: { hba1c: 0, fastingGlucose: 0, insulin: 0 },
    lipids: {
      totalCholesterol: 0,
      ldlCholesterol: 0,
      hdlCholesterol: 0,
      triglycerides: 0,
    },
    lifestyle: { everSmoked100: "No", currentSmoking: "Not at all" },
  };
}

function withinRange(feature: FeatureSpec, value: number): boolean {
  if (!Number.isFinite(value) || value <= 0) return false;
  if (feature.min !== undefined && value < feature.min) return false;
  if (feature.max !== undefined && value > feature.max) return false;
  return true;
}

function categoryInput(input: AssessmentInput, step: number): Record<string, unknown> {
  const category = WIZARD_STEP_CATEGORY[step];
  if (!category) return {};
  return (
    input[category as keyof AssessmentInput] as unknown as Record<string, unknown>
  );
}

export function validateStep(step: number, input: AssessmentInput): StepErrors {
  const errors: StepErrors = {};
  const section = categoryInput(input, step);
  const category = WIZARD_STEP_CATEGORY[step];
  if (!category) return errors;

  for (const feature of FEATURES) {
    if (feature.category !== category || feature.derived) continue;
    const value = section[feature.field.split(".")[1]];
    if (feature.type === "categorical") {
      if (!feature.options?.includes(String(value))) {
        errors[feature.name] = `${feature.label} is required`;
      }
      continue;
    }
    if (!withinRange(feature, value as number)) {
      const unit = feature.display?.unit ?? feature.unit;
      const factor = feature.display?.factor ?? 1;
      const min = feature.min !== undefined ? feature.min / factor : undefined;
      const max = feature.max !== undefined ? feature.max / factor : undefined;
      errors[feature.name] =
        unit && min !== undefined && max !== undefined
          ? `${feature.label} must be ${min}-${max} ${unit}`
          : `${feature.label} is required`;
    }
  }

  if (category === "lifestyle") {
    const { everSmoked100, currentSmoking } = input.lifestyle;
    if (everSmoked100 === "No" && currentSmoking !== "Not at all") {
      errors.SMQ040 = "Current smoking must be 'Not at all' when never smoked";
    }
  }

  if (category === "bodyComposition") {
    const height = input.bodyComposition.heightCm;
    const weight = input.bodyComposition.weightKg;
    const bmiSpec = getFeature("BMXBMI");
    if (
      Number.isFinite(height) &&
      Number.isFinite(weight) &&
      height > 0 &&
      weight > 0
    ) {
      const bmi = calculateBmi(height, weight);
      if (!withinRange(bmiSpec, bmi)) {
        errors[bmiSpec.name] =
          `Body mass index must be ${bmiSpec.min}-${bmiSpec.max} ${bmiSpec.unit}`;
      }
    }
  }

  return errors;
}

export function hasErrors(errors: StepErrors): boolean {
  return Object.keys(errors).length > 0;
}

export { getFeature };
