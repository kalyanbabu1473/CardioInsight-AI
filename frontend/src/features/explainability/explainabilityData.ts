import type { LucideIcon } from "lucide-react";
import { Wand2, Workflow, Shuffle } from "lucide-react";

export interface ImportanceRow {
  name: string;
  importance: number;
  description: string;
  note: string;
}

export interface ShapRow {
  name: string;
  value: number;
}

export interface LocalContribution {
  name: string;
  value: string;
  contribution: number;
}

export interface ModelMetricRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
}

export interface ExplainabilityMethod {
  icon: LucideIcon;
  name: string;
  description: string;
  tag: string;
  tone: string;
}

export const featureImportance: ImportanceRow[] = [
  {
    name: "RIDAGEYR — Age (years)",
    importance: 0.241,
    description: "Chronological age of the participant at the time of examination.",
    note: "Age is the single strongest driver of cardiovascular risk in the model.",
  },
  {
    name: "BPXOSY1 — Systolic BP (mmHg)",
    importance: 0.187,
    description: "Average systolic blood pressure from up to three seated measurements.",
    note: "Elevated systolic pressure directly raises the probability of a CVD event.",
  },
  {
    name: "LBXGH — HbA1c (%)",
    importance: 0.143,
    description: "Glycated hemoglobin, a marker of average blood glucose over 2–3 months.",
    note: "Long-term glucose control is a strong predictor of vascular complications.",
  },
  {
    name: "BMXBMI — Body Mass Index",
    importance: 0.112,
    description: "Body mass index calculated from measured height and weight.",
    note: "Obesity drives hypertension and metabolic syndrome, inflating risk.",
  },
  {
    name: "LBXTC — Total Cholesterol",
    importance: 0.097,
    description: "Total serum cholesterol concentration in mg/dL.",
    note: "Cholesterol is a core input to the pooled cohort risk equation.",
  },
  {
    name: "SMQ040 — Smoking Status",
    importance: 0.081,
    description: "Whether the participant currently smokes cigarettes.",
    note: "Smoking accelerates atherosclerosis and sharply elevates risk.",
  },
  {
    name: "LBDLDL — LDL Cholesterol",
    importance: 0.068,
    description: "Low-density lipoprotein cholesterol, the primary atherogenic fraction.",
    note: "LDL particles deposit in arterial walls, driving plaque formation.",
  },
  {
    name: "INDFMPIR — Income to Poverty",
    importance: 0.054,
    description: "Ratio of family income to the federal poverty threshold.",
    note: "Socioeconomic status proxies for access to care and lifestyle factors.",
  },
  {
    name: "LBXGLU — Fasting Glucose",
    importance: 0.043,
    description: "Fasting plasma glucose concentration in mg/dL.",
    note: "Glucose dysregulation is a precursor to diabetes-linked CVD.",
  },
  {
    name: "BMXWAIST — Waist (cm)",
    importance: 0.034,
    description: "Waist circumference measured in centimeters.",
    note: "Central adiposity is independently associated with metabolic risk.",
  },
  {
    name: "LBXNFOS — PFOS (ng/mL)",
    importance: 0.028,
    description: "Perfluorooctane sulfonic acid, a persistent environmental contaminant.",
    note: "Emerging evidence links PFAS exposure to raised cholesterol and CVD.",
  },
  {
    name: "PAD680 — Daily Sitting (min)",
    importance: 0.024,
    description: "Minutes per day spent sitting in leisure and work contexts.",
    note: "Sedentary time predicts CVD events independently of physical activity.",
  },
  {
    name: "URXUCD — Urinary Cadmium",
    importance: 0.019,
    description: "Cadmium concentration in urine, a marker of heavy metal exposure.",
    note: "Heavy metal exposure is associated with higher cardiovascular mortality.",
  },
  {
    name: "LBXBPB — Blood Lead",
    importance: 0.016,
    description: "Lead concentration in whole blood.",
    note: "Chronic lead exposure raises blood pressure and CVD risk.",
  },
  {
    name: "DR1TCAFF — Caffeine (mg)",
    importance: 0.011,
    description: "Estimated daily caffeine intake from dietary recall.",
    note: "Caffeine intake has a modest, dose-dependent effect on risk.",
  },
];

export const shapSummary: ShapRow[] = [
  { name: "RIDAGEYR", value: 0.198 },
  { name: "BPXOSY1", value: 0.151 },
  { name: "LBXGH", value: 0.112 },
  { name: "BMXBMI", value: 0.088 },
  { name: "LBXTC", value: 0.074 },
  { name: "LBDLDL", value: 0.061 },
  { name: "SMQ040", value: 0.055 },
  { name: "LBXGLU", value: 0.042 },
  { name: "INDFMPIR", value: -0.036 },
  { name: "BMXWAIST", value: 0.028 },
  { name: "LBXNFOS", value: -0.021 },
  { name: "PAD680", value: 0.017 },
];

export const localExplanation: LocalContribution[] = [
  { name: "Age", value: "48 years", contribution: 0.042 },
  { name: "Systolic BP", value: "142 mmHg", contribution: 0.038 },
  { name: "HbA1c", value: "6.8%", contribution: 0.021 },
  { name: "Smoking", value: "Yes", contribution: 0.016 },
  { name: "BMI", value: "31.2 kg/m²", contribution: 0.012 },
  { name: "HDL Cholesterol", value: "38 mg/dL", contribution: 0.008 },
  { name: "Fasting Glucose", value: "98 mg/dL", contribution: -0.002 },
  { name: "Income to Poverty", value: "1.4", contribution: -0.006 },
];

export const modelComparison: ModelMetricRow[] = [
  { model: "Logistic Regression", accuracy: 0.82, precision: 0.74, recall: 0.71, f1: 0.72, auc: 0.87 },
  { model: "Random Forest", accuracy: 0.84, precision: 0.77, recall: 0.74, f1: 0.75, auc: 0.89 },
  { model: "XGBoost", accuracy: 0.86, precision: 0.79, recall: 0.76, f1: 0.78, auc: 0.91 },
  { model: "Support Vector Machine", accuracy: 0.83, precision: 0.76, recall: 0.72, f1: 0.74, auc: 0.88 },
];

export const explainabilityMethods: ExplainabilityMethod[] = [
  {
    icon: Wand2,
    name: "SHAP",
    description:
      "Shapley values quantify how much each feature drives a prediction, providing consistent global and local attributions.",
    tag: "Global + Local",
    tone: "#2563EB",
  },
  {
    icon: Workflow,
    name: "LIME",
    description:
      "Local interpretable explanations fit a simple surrogate model around a single prediction to expose decision drivers.",
    tag: "Local",
    tone: "#38BDF8",
  },
  {
    icon: Shuffle,
    name: "Permutation Importance",
    description:
      "Global importance measured by the drop in model performance when each feature is randomly shuffled.",
    tag: "Global",
    tone: "#3B82F6",
  },
];

export const localRiskBase = 0.31;
export const localRiskFinal = 0.46;