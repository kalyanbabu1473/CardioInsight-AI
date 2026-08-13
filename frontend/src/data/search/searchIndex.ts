import { journeyData } from "../../features/dashboard/components/ResearchJourney/journeyData";

export type SearchItemType = "page" | "notebook" | "dataset" | "model";

export interface SearchItem {
  id: string;
  label: string;
  detail: string;
  type: SearchItemType;
  path: string;
  keywords: string[];
}

const pages: SearchItem[] = [
  {
    id: "page-dashboard",
    label: "Dashboard",
    detail: "Overview of the CVD research platform",
    type: "page",
    path: "/",
    keywords: ["home", "overview", "kpi", "metrics"],
  },
  {
    id: "page-project",
    label: "Project",
    detail: "Research roadmap and methodology",
    type: "page",
    path: "/project",
    keywords: ["overview", "phases", "notebooks", "roadmap"],
  },
  {
    id: "page-dataset",
    label: "Dataset",
    detail: "NHANES intake, variables and distributions",
    type: "page",
    path: "/dataset",
    keywords: ["nhanes", "data", "variables", "features"],
  },
  {
    id: "page-explainability",
    label: "Explainability",
    detail: "SHAP values and feature importance",
    type: "page",
    path: "/explainability",
    keywords: ["shap", "importance", "attribution", "interpret"],
  },
  {
    id: "page-assessment",
    label: "Assessment",
    detail: "Patient assessment wizard",
    type: "page",
    path: "/assessment",
    keywords: ["model", "inference", "wizard", "risk", "form"],
  },
  {
    id: "page-reports",
    label: "Reports",
    detail: "Generated research reports",
    type: "page",
    path: "/reports",
    keywords: ["export", "pdf", "summary"],
  },
  {
    id: "page-settings",
    label: "Settings",
    detail: "Platform preferences and configuration",
    type: "page",
    path: "/settings",
    keywords: ["preferences", "config", "profile"],
  },
];

const datasets: SearchItem[] = [
  {
    id: "ds-nhanes",
    label: "NHANES 2017-2020",
    detail: "15,560 participants · 647 variables",
    type: "dataset",
    path: "/dataset",
    keywords: ["intake", "participants", "survey", "nutrition"],
  },
  {
    id: "ds-clinical",
    label: "Clinical Exam Data",
    detail: "Blood pressure, lipids and biometric measures",
    type: "dataset",
    path: "/dataset",
    keywords: ["clinical", "lab", "biometric", "blood"],
  },
  {
    id: "ds-dietary",
    label: "Dietary & Genomic",
    detail: "Nutrition intake combined with genomic markers",
    type: "dataset",
    path: "/dataset",
    keywords: ["diet", "genomic", "nutrition", "markers"],
  },
];

const models: SearchItem[] = [
  {
    id: "md-logreg",
    label: "Logistic Regression",
    detail: "Clinical baseline classifier",
    type: "model",
    path: "/explainability",
    keywords: ["model", "baseline", "classifier"],
  },
  {
    id: "md-rf",
    label: "Random Forest",
    detail: "Ensemble tree model",
    type: "model",
    path: "/explainability",
    keywords: ["model", "ensemble", "trees"],
  },
  {
    id: "md-xgb",
    label: "XGBoost",
    detail: "Gradient boosted trees (champion)",
    type: "model",
    path: "/explainability",
    keywords: ["model", "boosting", "gradient"],
  },
  {
    id: "md-svm",
    label: "Support Vector Machine",
    detail: "Benchmarked against ensemble baselines",
    type: "model",
    path: "/explainability",
    keywords: ["model", "svm", "benchmark"],
  },
];

const notebooks: SearchItem[] = journeyData.map((nb) => ({
  id: `nb-${nb.id}`,
  label: nb.title,
  detail: `${nb.phase} · ${nb.id}`,
  type: "notebook",
  path: nb.href,
  keywords: [nb.phase, "notebook"],
}));

export const searchIndex: SearchItem[] = [
  ...pages,
  ...datasets,
  ...models,
  ...notebooks,
];

export const typeLabels: Record<SearchItemType, string> = {
  page: "Page",
  notebook: "Notebook",
  dataset: "Dataset",
  model: "Model",
};