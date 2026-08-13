/**
 * Assessment domain logic — pure, framework-free functions that power the
 * guided clinical wizard and the risk engine. Kept separate from React so the
 * same model can be swapped for a real backend inference call later without
 * touching the UI.
 *
 * The intake is contract-driven: every input maps 1:1 to one of the 44 NHANES
 * features the production Random Forest was trained on (see the feature
 * contract at `/data/assessment/featureContract.generated.ts`, generated from
 * `feature_contract.json`). There is no heuristic risk model on the frontend —
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
export type GenderOption = "Male" | "Female";
export type SmokingStatusOption = "Every day" | "Some days" | "Not at all";

export interface DemographicsInput {
  age: number; // RIDAGEYR
  gender: GenderOption; // RIAGENDR
}

export interface BodyCompositionInput {
  weightKg: number; // BMXWT
  heightCm: number; // BMXHT
  waistCm: number; // BMXWAIST
}

export interface BloodPressureInput {
  systolicBP1: number; // BPXOSY1
  systolicBP2: number; // BPXOSY2
  systolicBP3: number; // BPXOSY3
  hypertensionDiagnosis: BinaryOption; // BPQ020
}

export interface MetabolicInput {
  hba1c: number; // LBXGH
  fastingGlucose: number; // LBXGLU
  insulin: number; // LBXIN
}

export interface LipidsInput {
  ldlCholesterol: number; // LBDLDL
  totalCholesterol: number; // LBXTC
  triglycerides: number; // LBXTR
  hdlCholesterol: number; // LBDHDD
}

export interface EnvironmentalToxinsInput {
  bloodCadmium: number; // LBXBCD
  bloodLead: number; // LBXBPB
  bloodSelenium: number; // LBXBSE
  urinaryThallium: number; // URXUTL
  urinaryLead: number; // URXUPB
  urinaryCadmium: number; // URXUCD
  urinaryCobalt: number; // URXUCO
  urinaryBarium: number; // URXUBA
  urinaryAntimony: number; // URXUSB
  urinaryTungsten: number; // URXUTU
}

export interface PfasInput {
  pfos: number; // LBXNFOS
  pfoa: number; // LBXNFOA
  pfhxs: number; // LBXPFHS
  pfna: number; // LBXPFNA
  smPfos: number; // LBXMFOS
}

export interface UrinaryOpesInput {
  bcep: number; // URXBCEP
  bdcpp: number; // URXBDCP
  dphp: number; // URXDPHP
}

export interface MedicalHistoryInput {
  highCholesterolDiagnosis: BinaryOption; // BPQ080
  cholesterolMedication: BinaryOption; // BPQ090D
  arthritis: BinaryOption; // MCQ160A
}

export interface LifestyleInput {
  workedOutsideHome7d: BinaryOption; // SMQ856
  currentSmoking: SmokingStatusOption; // SMQ040
  dailySittingMinutes: number; // PAD680
  dietaryCaffeineMg: number; // DR1TCAFF
  alcoholicDrinksPerDay: number; // ALQ130
}

export interface SocioeconomicInput {
  incomePovertyRatio: number; // INDFMPIR
}

/** The complete clinical intake — all 44 model features across 11 sections. */
export interface AssessmentInput {
  demographics: DemographicsInput;
  bodyComposition: BodyCompositionInput;
  bloodPressure: BloodPressureInput;
  metabolic: MetabolicInput;
  lipids: LipidsInput;
  environmentalToxins: EnvironmentalToxinsInput;
  pfas: PfasInput;
  urinaryOpes: UrinaryOpesInput;
  medicalHistory: MedicalHistoryInput;
  lifestyle: LifestyleInput;
  socioeconomic: SocioeconomicInput;
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
  confidence: number;
  interpretation: string;
  topFactors: Contribution[];
  recommendations: RecommendationCategories;
}

export type StepErrors = Record<string, string>;

/* ------------------------------------------------------------------ */
/*  Model configuration                                                */
/* ------------------------------------------------------------------ */

export const PREDICTION_MODEL = {
  name: "Random Forest (Composite CVD — 44 features)",
  tagline: "Production Model",
  description:
    "Ensemble of decision trees trained on the NHANES consensus dataset with 44 clinical, environmental and PFAS features collected across the 11-section wizard.",
};

export const STEP_COUNT = 12;

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
    case "Blood Pressure":
      return "Hemodynamic status";
    case "Metabolic":
      return "Glucose and insulin panel";
    case "Lipids":
      return "Cholesterol panel";
    case "Environmental Toxins":
      return "Heavy metals in blood and urine";
    case "PFAS Compounds":
      return "Persistent organic pollutants";
    case "Urinary Organophosphate Esters":
      return "Flame-retardant metabolites";
    case "Medical History":
      return "Diagnoses and medication";
    case "Lifestyle":
      return "Behavioral risk factors";
    case "Socioeconomic":
      return "Income context";
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
  6: "environmentalToxins",
  7: "pfas",
  8: "urinaryOpes",
  9: "medicalHistory",
  10: "lifestyle",
  11: "socioeconomic",
};

/* ------------------------------------------------------------------ */
/*  Field access & formatting                                          */
/* ------------------------------------------------------------------ */

/** Reads the value for a feature from an assessment input by its dot-path. */
export function featureValue(
  input: AssessmentInput,
  feature: FeatureSpec,
): number | BinaryOption {
  const [section, field] = feature.field.split(".");
  const sectionValue = (
    input[section as keyof AssessmentInput] as unknown as Record<string, unknown>
  );
  return sectionValue?.[field] as number | BinaryOption;
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

/* ------------------------------------------------------------------ */
/*  BMI helpers                                                        */
/* ------------------------------------------------------------------ */

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";

export function calculateBmi(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi <= 0) return "Normal";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/* ------------------------------------------------------------------ */
/*  Initial state                                                      */
/* ------------------------------------------------------------------ */

export function createInitialInput(): AssessmentInput {
  return {
    demographics: { age: 0, gender: "Female" },
    bodyComposition: { weightKg: 0, heightCm: 0, waistCm: 0 },
    bloodPressure: {
      systolicBP1: 0,
      systolicBP2: 0,
      systolicBP3: 0,
      hypertensionDiagnosis: "No",
    },
    metabolic: { hba1c: 0, fastingGlucose: 0, insulin: 0 },
    lipids: {
      ldlCholesterol: 0,
      totalCholesterol: 0,
      triglycerides: 0,
      hdlCholesterol: 0,
    },
    environmentalToxins: {
      bloodCadmium: 0,
      bloodLead: 0,
      bloodSelenium: 0,
      urinaryThallium: 0,
      urinaryLead: 0,
      urinaryCadmium: 0,
      urinaryCobalt: 0,
      urinaryBarium: 0,
      urinaryAntimony: 0,
      urinaryTungsten: 0,
    },
    pfas: { pfos: 0, pfoa: 0, pfhxs: 0, pfna: 0, smPfos: 0 },
    urinaryOpes: { bcep: 0, bdcpp: 0, dphp: 0 },
    medicalHistory: {
      highCholesterolDiagnosis: "No",
      cholesterolMedication: "No",
      arthritis: "No",
    },
    lifestyle: {
      workedOutsideHome7d: "No",
      currentSmoking: "Not at all",
      dailySittingMinutes: 0,
      dietaryCaffeineMg: 0,
      alcoholicDrinksPerDay: 0,
    },
    socioeconomic: { incomePovertyRatio: 0 },
  };
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

function withinRange(feature: FeatureSpec, value: number): boolean {
  if (value <= 0) return false;
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
    if (feature.type === "continuous" && !withinRange(feature, value as number)) {
      const unit = feature.display?.unit ?? feature.unit;
      const min = feature.min !== undefined ? feature.min / (feature.display?.factor ?? 1) : undefined;
      const max = feature.max !== undefined ? feature.max / (feature.display?.factor ?? 1) : undefined;
      errors[feature.name] =
        unit && min !== undefined && max !== undefined
          ? `${feature.label} must be ${min}–${max} ${unit}`
          : `${feature.label} is required`;
    }
  }
  return errors;
}

export function hasErrors(errors: StepErrors): boolean {
  return Object.keys(errors).length > 0;
}

export { getFeature };