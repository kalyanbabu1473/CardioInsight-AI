import type { LucideIcon } from "lucide-react";
import {
  Database,
  Target,
  Brain,
  SlidersHorizontal,
  ShieldCheck,
  FolderKanban,
  FileCheck2,
  Boxes,
  BarChart3,
  HeartPulse,
  BrainCircuit,
  Activity,
  Trees,
  Zap,
} from "lucide-react";

export interface SideCardData {
  icon: LucideIcon;
  title: string;
  items: string[];
  color: string;
}

export interface StageCardData {
  phase: string;
  title: string;
  notebooks: string[];
  color: string;
  icon: LucideIcon;
}

export interface ModelCardData {
  title: string;
  notebook: string;
  color: string;
  icon: LucideIcon;
}

export const leftCards: SideCardData[] = [
  {
    icon: Database,
    title: "NHANES Dataset",
    color: "#3B82F6",
    items: ["Demographics", "Laboratory", "Questionnaire"],
  },
  {
    icon: Target,
    title: "Clinical Target",
    color: "#3B82F6",
    items: ["Composite CVD", "Binary Classification", "MCQ160B\u2013F"],
  },
  {
    icon: Brain,
    title: "Feature Engineering",
    color: "#60A5FA",
    items: ["Random Forest", "Mutual Information", "LASSO"],
  },
  {
    icon: SlidersHorizontal,
    title: "Data Preprocessing",
    color: "#3B82F6",
    items: ["Missing Value Imputation", "Feature Encoding", "Normalization"],
  },
  {
    icon: ShieldCheck,
    title: "Clinical Validation",
    color: "#38BDF8",
    items: ["Medical Knowledge", "Risk Factors", "Explainable AI"],
  },
];

export const stageCards: StageCardData[] = [
  {
    phase: "PHASE 01",
    title: "Data Foundation",
    notebooks: ["NB01", "NB02"],
    color: "#3B82F6",
    icon: Database,
  },
  {
    phase: "PHASE 02",
    title: "Data Preparation",
    notebooks: ["NB03", "NB04"],
    color: "#3B82F6",
    icon: SlidersHorizontal,
  },
  {
    phase: "PHASE 04",
    title: "Model Evaluation",
    notebooks: ["NB09", "NB10"],
    color: "#60A5FA",
    icon: BarChart3,
  },
  {
    phase: "PHASE 05",
    title: "Explainable AI & Deployment",
    notebooks: ["NB11", "NB12", "NB13"],
    color: "#38BDF8",
    icon: HeartPulse,
  },
];

export const modelCards: ModelCardData[] = [
  {
    title: "Logistic Regression",
    notebook: "NB05",
    color: "#3B82F6",
    icon: Activity,
  },
  {
    title: "Random Forest",
    notebook: "NB06",
    color: "#3B82F6",
    icon: Trees,
  },
  {
    title: "XGBoost",
    notebook: "NB07",
    color: "#60A5FA",
    icon: Zap,
  },
  {
    title: "Support Vector Machine",
    notebook: "NB08",
    color: "#3B82F6",
    icon: BrainCircuit,
  },
];

export const outputCards: SideCardData[] = [
  {
    icon: FolderKanban,
    title: "Integrated NHANES Dataset",
    color: "#3B82F6",
    items: ["15,560 Participants", "647 Variables", "Merged Dataset"],
  },
  {
    icon: FileCheck2,
    title: "ML Ready Dataset",
    color: "#3B82F6",
    items: ["Cleaned Data", "Feature Matrix", "Train/Test Split"],
  },
  {
    icon: Boxes,
    title: "Trained Models",
    color: "#60A5FA",
    items: ["4 Algorithms", "Hyperparameter Tuning", "Cross Validation"],
  },
  {
    icon: BarChart3,
    title: "Best Model",
    color: "#60A5FA",
    items: ["ROC-AUC", "Accuracy", "Feature Importance"],
  },
  {
    icon: HeartPulse,
    title: "Clinical AI Platform",
    color: "#38BDF8",
    items: ["Risk Prediction", "Explainable AI", "Deployment"],
  },
];