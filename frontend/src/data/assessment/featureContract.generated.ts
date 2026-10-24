// GENERATED FILE - do not edit by hand.
// Source: feature_contract.json at the repository root.
// Regenerate: python backend/scripts/sync_feature_contract_frontend.py

export type CategoryKey =
  | "demographics"
  | "bodyComposition"
  | "bloodPressure"
  | "metabolic"
  | "lipids"
  | "lifestyle"

export interface FeatureSpec {
  name: string;
  /** Dot-path into AssessmentInput where this feature value lives. */
  field: string;
  label: string;
  unit: string;
  domain: string;
  category: CategoryKey;
  notes: string;
  required: boolean;
  type: 'continuous' | 'categorical';
  min?: number;
  max?: number;
  /** Dataset average for continuous features (suggested typical value). */
  mean?: number;
  /** Sample group within a step (e.g. 'blood' / 'urine' for toxins). */
  subgroup?: string;
  options?: readonly string[];
  encode?: Record<string, number>;
  derived?: boolean;
  /** Optional display override (e.g. waist shown in inches, stored in cm). */
  display?: { unit: string; factor: number };
}

export const SCHEMA_VERSION: string =
  "3.0.0";

export const MODEL_FILE: string =
  "CardioAI_Clinical_Model.pkl";

export const TARGET: string =
  "Composite_CVD";

export const FEATURE_COUNT: number =
  18;

export const CATEGORY_LABELS: Readonly<Record<CategoryKey, string>> = {
  "demographics": "Demographics",
  "bodyComposition": "Body Composition",
  "bloodPressure": "Blood Pressure & History",
  "metabolic": "Metabolic Panel",
  "lipids": "Lipid Panel",
  "lifestyle": "Lifestyle",
};

export const CATEGORY_ORDER: readonly CategoryKey[] = [
  "demographics",
  "bodyComposition",
  "bloodPressure",
  "metabolic",
  "lipids",
  "lifestyle",
];

export const SUBGROUP_LABELS: Readonly<Record<string, string>> = {
};

export const FEATURE_ORDER: readonly string[] = [
  "RIDAGEYR",
  "RIAGENDR",
  "BMXHT",
  "BMXWT",
  "BMXWAIST",
  "BMXBMI",
  "BPXOSY1",
  "BPXODI1",
  "BPQ020",
  "LBXGH",
  "LBXGLU",
  "LBXTC",
  "LBDLDL",
  "LBDHDD",
  "LBXTR",
  "LBXIN",
  "SMQ020",
  "SMQ040",
];

export const FEATURES: readonly FeatureSpec[] = [
  {
    name: "RIDAGEYR",
    field: "demographics.age",
    label: "Age",
    unit: "years",
    domain: "Demographics",
    category: "demographics",
    notes: "Age in years (right-censored at 80). The deployed model is trained and validated on adults aged 18-80; pediatric assessments are not supported.",
    required: true,
    type: "continuous",
    min: 18, max: 80, mean: 49.13,
  },
  {
    name: "RIAGENDR",
    field: "demographics.sex",
    label: "Sex",
    unit: "",
    domain: "Demographics",
    category: "demographics",
    notes: "Biological sex (Male=1, Female=2).",
    required: true,
    type: "categorical",
    options: ["Male", "Female"],
    encode: {"Male": 1, "Female": 2},
  },
  {
    name: "BMXHT",
    field: "bodyComposition.heightCm",
    label: "Height",
    unit: "cm",
    domain: "Body Measurements",
    category: "bodyComposition",
    notes: "Standing height.",
    required: true,
    type: "continuous",
    min: 131.1, max: 198.7, mean: 167.23,
  },
  {
    name: "BMXWT",
    field: "bodyComposition.weightKg",
    label: "Weight",
    unit: "kg",
    domain: "Body Measurements",
    category: "bodyComposition",
    notes: "Measured body weight.",
    required: true,
    type: "continuous",
    min: 39.6, max: 204.6, mean: 83.29,
  },
  {
    name: "BMXWAIST",
    field: "bodyComposition.waistCm",
    label: "Waist circumference",
    unit: "cm",
    domain: "Body Measurements",
    category: "bodyComposition",
    notes: "Measured waist circumference.",
    required: true,
    type: "continuous",
    min: 61.1, max: 178.0, mean: 100.28,
    display: { unit: "in", factor: 2.54 },
  },
  {
    name: "BMXBMI",
    field: "bodyComposition.bmi",
    label: "Body mass index",
    unit: "kg/m2",
    domain: "Body Measurements",
    category: "bodyComposition",
    notes: "Derived from measured height and weight (kg/m^2), rounded to four decimals. Training and live inference use the same derivation; the imputed NHANES BMXBMI column is not used.",
    required: true,
    type: "continuous",
    min: 15.4317, max: 67.0369, mean: 29.7088,
    derived: true,
  },
  {
    name: "BPXOSY1",
    field: "bloodPressure.systolicBP",
    label: "Systolic blood pressure",
    unit: "mmHg",
    domain: "Blood Pressure",
    category: "bloodPressure",
    notes: "First systolic blood pressure reading.",
    required: true,
    type: "continuous",
    min: 66.0, max: 217.0, mean: 123.61,
  },
  {
    name: "BPXODI1",
    field: "bloodPressure.diastolicBP",
    label: "Diastolic blood pressure",
    unit: "mmHg",
    domain: "Blood Pressure",
    category: "bloodPressure",
    notes: "First diastolic blood pressure reading.",
    required: true,
    type: "continuous",
    min: 36.0, max: 131.0, mean: 74.71,
  },
  {
    name: "BPQ020",
    field: "bloodPressure.hypertensionDiagnosis",
    label: "High blood pressure diagnosis",
    unit: "",
    domain: "Blood Pressure",
    category: "bloodPressure",
    notes: "Ever told by a doctor you had high blood pressure (Yes=1, No=2). Refused/don't-know codes are excluded.",
    required: true,
    type: "categorical",
    options: ["Yes", "No"],
    encode: {"Yes": 1, "No": 2},
  },
  {
    name: "LBXGH",
    field: "metabolic.hba1c",
    label: "HbA1c / glycated hemoglobin",
    unit: "%",
    domain: "Laboratory",
    category: "metabolic",
    notes: "Glycohemoglobin from whole blood.",
    required: true,
    type: "continuous",
    min: 2.8, max: 15.2, mean: 5.83,
  },
  {
    name: "LBXGLU",
    field: "metabolic.fastingGlucose",
    label: "Fasting glucose",
    unit: "mg/dL",
    domain: "Laboratory",
    category: "metabolic",
    notes: "Fasting serum glucose.",
    required: true,
    type: "continuous",
    min: 47.0, max: 451.0, mean: 112.19,
  },
  {
    name: "LBXTC",
    field: "lipids.totalCholesterol",
    label: "Total cholesterol",
    unit: "mg/dL",
    domain: "Laboratory",
    category: "lipids",
    notes: "Total serum cholesterol.",
    required: true,
    type: "continuous",
    min: 76, max: 428, mean: 182.64,
  },
  {
    name: "LBDLDL",
    field: "lipids.ldlCholesterol",
    label: "LDL cholesterol",
    unit: "mg/dL",
    domain: "Laboratory",
    category: "lipids",
    notes: "Direct low-density lipoprotein cholesterol.",
    required: true,
    type: "continuous",
    min: 7, max: 357, mean: 108.23,
  },
  {
    name: "LBDHDD",
    field: "lipids.hdlCholesterol",
    label: "HDL cholesterol",
    unit: "mg/dL",
    domain: "Laboratory",
    category: "lipids",
    notes: "Direct high-density lipoprotein cholesterol.",
    required: true,
    type: "continuous",
    min: 11, max: 187, mean: 53.67,
  },
  {
    name: "LBXTR",
    field: "lipids.triglycerides",
    label: "Triglycerides",
    unit: "mg/dL",
    domain: "Laboratory",
    category: "lipids",
    notes: "Serum triglycerides.",
    required: true,
    type: "continuous",
    min: 10.0, max: 399.0, mean: 103.72,
  },
  {
    name: "LBXIN",
    field: "metabolic.insulin",
    label: "Fasting insulin",
    unit: "uU/mL",
    domain: "Laboratory",
    category: "metabolic",
    notes: "Fasting serum insulin.",
    required: true,
    type: "continuous",
    min: 0.71, max: 512.5, mean: 14.66,
  },
  {
    name: "SMQ020",
    field: "lifestyle.everSmoked100",
    label: "Ever smoked 100 cigarettes",
    unit: "",
    domain: "Lifestyle",
    category: "lifestyle",
    notes: "Ever smoked at least 100 cigarettes in your lifetime (Yes=1, No=2). Refused/don't-know codes are excluded.",
    required: true,
    type: "categorical",
    options: ["Yes", "No"],
    encode: {"Yes": 1, "No": 2},
  },
  {
    name: "SMQ040",
    field: "lifestyle.currentSmoking",
    label: "Current cigarette smoking",
    unit: "",
    domain: "Lifestyle",
    category: "lifestyle",
    notes: "Currently smoke cigarettes (Every day=1, Some days=2, Not at all=3). For never-smokers (SMQ020=No), NHANES skips this question and the model uses the structural skip value 3; live input must still say 'Not at all'.",
    required: true,
    type: "categorical",
    options: ["Every day", "Some days", "Not at all"],
    encode: {"Every day": 1, "Some days": 2, "Not at all": 3},
  },
];

const byName = new Map(FEATURES.map((f) => [f.name, f]));

export function getFeature(name: string): FeatureSpec {
  const spec = byName.get(name);
  if (!spec) throw new Error(`Unknown feature: ${name}`);
  return spec;
}

export function featuresInCategory(key: CategoryKey): readonly FeatureSpec[] {
  return FEATURES.filter((f) => f.category === key);
}
