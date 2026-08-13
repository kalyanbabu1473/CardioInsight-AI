export type JourneyNotebookStatus = "completed" | "in-progress";

export interface JourneyNotebook {
  id: string;
  title: string;
  description: string;
  status: JourneyNotebookStatus;
  phase: string;
  accent: string;
  href: string;
}

export const journeyData: JourneyNotebook[] = [
  {
    id: "NB01",
    title: "Data Validation",
    description:
      "Validate the raw NHANES intake and screen 15,560 participants across 647 variables for quality before modeling.",
    status: "completed",
    phase: "Data Foundation",
    accent: "#3B82F6",
    href: "/notebooks/NB01",
  },
  {
    id: "NB02",
    title: "Exploratory Data Analysis",
    description:
      "Explore distributions and correlations to surface the CVD signal that guides the downstream analysis plan.",
    status: "completed",
    phase: "Data Foundation",
    accent: "#3B82F6",
    href: "/notebooks/NB02",
  },
  {
    id: "NB03",
    title: "Data Dictionary",
    description:
      "Build the canonical dictionary that maps every variable and groups them into clinical, dietary and genomic domains.",
    status: "completed",
    phase: "Data Preparation",
    accent: "#3B82F6",
    href: "/notebooks/NB03",
  },
  {
    id: "NB04",
    title: "Feature Engineering",
    description:
      "Impute missing values, encode categoricals and normalize features into a clean, ML-ready training matrix.",
    status: "completed",
    phase: "Data Preparation",
    accent: "#3B82F6",
    href: "/notebooks/NB04",
  },
  {
    id: "NB05",
    title: "Logistic Regression",
    description:
      "Train the clinical baseline classifier on the engineered feature matrix and establish the reference performance.",
    status: "completed",
    phase: "Model Development",
    accent: "#60A5FA",
    href: "/notebooks/NB05",
  },
  {
    id: "NB06",
    title: "Random Forest",
    description:
      "Fit an ensemble of decision trees to capture non-linear gene-diet-environment interactions in CVD risk.",
    status: "completed",
    phase: "Model Development",
    accent: "#60A5FA",
    href: "/notebooks/NB06",
  },
  {
    id: "NB07",
    title: "XGBoost",
    description:
      "Boost gradient trees with tuned hyperparameters for robust, high-accuracy cardiovascular risk prediction.",
    status: "completed",
    phase: "Model Development",
    accent: "#60A5FA",
    href: "/notebooks/NB07",
  },
  {
    id: "NB08",
    title: "Support Vector Machine",
    description:
      "Benchmark a support vector machine against the ensemble baselines to complete the model comparison.",
    status: "completed",
    phase: "Model Development",
    accent: "#60A5FA",
    href: "/notebooks/NB08",
  },
  {
    id: "NB09",
    title: "Model Evaluation",
    description:
      "Compare all four models on ROC-AUC, accuracy and clinical decision thresholds to crown the champion.",
    status: "completed",
    phase: "Model Evaluation",
    accent: "#38BDF8",
    href: "/notebooks/NB09",
  },
  {
    id: "NB10",
    title: "Explainability",
    description:
      "Use SHAP and feature importance to explain exactly which factors drive each predicted cardiovascular risk.",
    status: "completed",
    phase: "Explainability",
    accent: "#93C5FD",
    href: "/notebooks/NB10",
  },
  {
    id: "NB11",
    title: "Clinical Validation",
    description:
      "Sanity-check model predictions against established, medically accepted cardiovascular risk factors.",
    status: "completed",
    phase: "Clinical Validation",
    accent: "#93C5FD",
    href: "/notebooks/NB11",
  },
  {
    id: "NB12",
    title: "Deployment",
    description:
      "Package the champion model into a fast, production-ready inference service for real-time scoring.",
    status: "completed",
    phase: "Deployment",
    accent: "#3B82F6",
    href: "/notebooks/NB12",
  },
  {
    id: "NB13",
    title: "Final AI Platform",
    description:
      "Ship the interactive CardioInsight AI platform for real-time, explainable cardiovascular risk assessment.",
    status: "in-progress",
    phase: "AI Platform",
    accent: "#3B82F6",
    href: "/notebooks/NB13",
  },
];