import type { LucideIcon } from "lucide-react";
import {
  Database,
  Workflow,
  GitBranch,
  GitFork,
  LineChart,
  Brain,
  Shield,
  Cpu,
} from "lucide-react";

/* ==========================================================
   MODEL DATA — extracted from CVD_ML_PYTHON notebooks
   ----------------------------------------------------------
   Sources:
   - 05_Logistic_Regression.ipynb
   - 06_Random_Forest.ipynb
   - 07_XGBoost.ipynb
   - 08_Support_Vector_Machine.ipynb
   - 09_Model_Comparison.ipynb
   - 10_Final_Report_And_Interpretatoin.ipynb
   - 13_Deploymnet_Model_&_Clinical_Risk_predictin.ipynb
   - Outputs/Model_Comparison_Results.csv
   ========================================================== */

export interface Metric {
  label: string;
  value: number;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelEntry {
  id: string;
  name: string;
  tagline: string;
  explanation: string;
  howItWorks: string;
  trainingStatus: string;
  production: boolean;
  metrics: Metric[];
  confusion: ConfusionMatrix;
  classificationReport: {
    class0: { precision: number; recall: number; f1: number; support: number };
    class1: { precision: number; recall: number; f1: number; support: number };
  };
  advantages: string[];
  limitations: string[];
  bestUseCase: string;
  predictedThroughput: string;
  hyperparams: { label: string; value: string }[];
  preprocessing: string[];
  notebookId: string;
}

export interface PipelineStep {
  icon: LucideIcon;
  title: string;
  detail: string;
}

export interface FeatureRow {
  feature: string;
  value: number;
  source: string;
}

/* ==========================================================
   CORESET — comparison dataset metrics (Training Dataset Size)
   ========================================================== */
export const datasetContext = {
  nhanes: "NHANES 2017–2020",
  participants: 15560,
  initialFeatures: 647,
  selectedFeatures: 44,
  trainSamples: 12365,
  testSamples: 3092,
  smoteTrainSamples: 22928,
  target: "Composite CVD",
};

/* ==========================================================
   Model performance — from Model_Comparison_Results.csv
   (Notebook 09) and individual model notebooks.
   ========================================================== */
export const models: ModelEntry[] = [
  {
    id: "logistic",
    name: "Logistic Regression",
    tagline: "Linear clinical baseline",
    explanation:
      "A linear probabilistic classifier that models the log-odds of cardiovascular disease as a linear combination of the 44 clinical, dietary and environmental features.",
    howItWorks:
      "Fits a linear decision boundary in feature space, estimating the probability of the positive (CVD) class via a logistic (sigmoid) function. Coefficients directly reflect feature influence on risk.",
    trainingStatus: "Trained",
    production: false,
    metrics: [
      { label: "Accuracy", value: 0.8503 },
      { label: "Precision", value: 0.292 },
      { label: "Recall", value: 0.7422 },
      { label: "F1 Score", value: 0.4191 },
      { label: "ROC AUC", value: 0.8992 },
      { label: "MCC", value: 0.402 },
      { label: "Kappa", value: 0.3513 },
    ],
    confusion: { tn: 2466, fp: 401, fn: 58, tp: 167 },
    classificationReport: {
      class0: { precision: 0.98, recall: 0.86, f1: 0.91, support: 2867 },
      class1: { precision: 0.29, recall: 0.74, f1: 0.42, support: 225 },
    },
    advantages: [
      "Fastest training and inference of all four models.",
      "Highly interpretable coefficient-based model.",
      "Strong ROC-AUC (0.8992) for a linear baseline.",
    ],
    limitations: [
      "Assumes linear relationships and cannot model complex interactions.",
      "Recall (0.74) trailing the SVM while precision stays low.",
    ],
    bestUseCase:
      "Interpretable screening and coefficient-level risk insight.",
    predictedThroughput: "Fastest inference",
    hyperparams: [
      { label: "random_state", value: "42" },
      { label: "max_iter", value: "1000" },
    ],
    preprocessing: [
      "SMOTE balancing of training set (22928 samples)",
      "44 final features from consensus feature selection",
      "Missing value imputation",
    ],
    notebookId: "05_Logistic_Regression.ipynb",
  },
  {
    id: "random-forest",
    name: "Random Forest",
    tagline: "Production ensemble (best ROC-AUC)",
    explanation:
      "An ensemble of 500 decision trees that aggregate bootstrapped candidates to capture complex, non-linear gene–diet–environment interactions in CVD risk.",
    howItWorks:
      "Builds many decision trees on bootstrapped samples with random feature subsets, then averages tree probabilities. Feature importance is derived from mean impurity reduction.",
    trainingStatus: "Trained",
    production: true,
    metrics: [
      { label: "Accuracy", value: 0.9017 },
      { label: "Precision", value: 0.3614 },
      { label: "Recall", value: 0.4578 },
      { label: "F1 Score", value: 0.4039 },
      { label: "ROC AUC", value: 0.9051 },
      { label: "MCC", value: 0.3541 },
      { label: "Kappa", value: 0.3512 },
    ],
    confusion: { tn: 2695, fp: 172, fn: 122, tp: 103 },
    classificationReport: {
      class0: { precision: 0.96, recall: 0.94, f1: 0.95, support: 2867 },
      class1: { precision: 0.36, recall: 0.46, f1: 0.4, support: 225 },
    },
    advantages: [
      "Highest ROC-AUC (0.9051) → selected as research champion.",
      "Handles non-linear interactions naturally.",
      "Built-in feature importance + SHAP compatibility.",
      "Handles imbalanced data with class_weight='balanced'.",
    ],
    limitations: [
      "Slower inference than linear or boosted approaches.",
      "Lower precision on the minority class (0.36).",
      "More memory-intensive as a forest.",
    ],
    bestUseCase:
      "The research champion. The deployed CardioInsight classifier uses the same Random Forest hyperparameters on the 20 clinical features the assessment wizard collects.",
    predictedThroughput: "Fast ensemble inference",
    hyperparams: [
      { label: "n_estimators", value: "500" },
      { label: "max_depth", value: "20" },
      { label: "class_weight", value: "'balanced'" },
      { label: "n_jobs", value: "-1" },
      { label: "random_state", value: "42" },
    ],
    preprocessing: [
      "SMOTE balancing of training set (44 features)",
      "class_weight='balanced' to counter imbalance",
      "Stratified train-test split (80/20)",
    ],
    notebookId: "06_Random_Forest.ipynb",
  },
  {
    id: "xgb",
    name: "XGBoost",
    tagline: "Gradient boosted trees",
    explanation:
      "An optimized gradient-boosting library that sequentially fits boosted decision trees, minimizing logloss across 500 boosting rounds.",
    howItWorks:
      "Adds weak trees one at a time, each correcting the residuals of the previous ensemble, using learning-rate shrinkage and column subsampling for regularization.",
    trainingStatus: "Trained",
    production: false,
    metrics: [
      { label: "Accuracy", value: 0.9091 },
      { label: "Precision", value: 0.3627 },
      { label: "Recall", value: 0.3289 },
      { label: "F1 Score", value: 0.345 },
      { label: "ROC AUC", value: 0.9007 },
      { label: "MCC", value: 0.2967 },
      { label: "Kappa", value: 0.2963 },
    ],
    confusion: { tn: 2724, fp: 143, fn: 151, tp: 74 },
    classificationReport: {
      class0: { precision: 0.95, recall: 0.95, f1: 0.95, support: 2867 },
      class1: { precision: 0.36, recall: 0.33, f1: 0.34, support: 225 },
    },
    advantages: [
      "Best overall accuracy (0.9091).",
      "Regularized boosting reduces overfitting.",
      "Parallel training with n_jobs=-1.",
    ],
    limitations: [
      "Lowest recall of the minority class (0.33), missing many true CVD cases.",
      "More hyperparameters requiring tuning.",
    ],
    bestUseCase:
      "Accuracy-optimized scoring when minority recall is less critical.",
    predictedThroughput: "Very fast inference",
    hyperparams: [
      { label: "n_estimators", value: "500" },
      { label: "max_depth", value: "6" },
      { label: "learning_rate", value: "0.05" },
      { label: "subsample", value: "0.8" },
      { label: "colsample_bytree", value: "0.8" },
      { label: "eval_metric", value: "'logloss'" },
      { label: "random_state", value: "42" },
    ],
    preprocessing: [
      "SMOTE balancing of training set (22928 samples)",
      "Gradient boosting on 44 selected features",
    ],
    notebookId: "07_XGBoost.ipynb",
  },
  {
    id: "svm",
    name: "Support Vector Machine",
    tagline: "RBF kernel benchmark",
    explanation:
      "A margin-based classifier using an RBF kernel to separate CVD risk groups in a high-dimensional feature space.",
    howItWorks:
      "Projects data into a high-dimensional space via kernels and finds the maximum-margin hyperplane separating classes, using probability=True for output probability estimates.",
    trainingStatus: "Trained",
    production: false,
    metrics: [
      { label: "Accuracy", value: 0.7474 },
      { label: "Precision", value: 0.2134 },
      { label: "Recall", value: 0.92 },
      { label: "F1 Score", value: 0.3464 },
      { label: "ROC AUC", value: 0.8886 },
      { label: "MCC", value: 0.366 },
      { label: "Kappa", value: 0.2589 },
    ],
    confusion: { tn: 2093, fp: 774, fn: 18, tp: 207 },
    classificationReport: {
      class0: { precision: 0.99, recall: 0.73, f1: 0.84, support: 2867 },
      class1: { precision: 0.21, recall: 0.92, f1: 0.35, support: 225 },
    },
    advantages: [
      "Highest recall of all models (0.92) — captures nearly all CVD positives.",
      "Robust to non-linear boundaries.",
    ],
    limitations: [
      "Low precision (0.21) generates many false positives.",
      "Slowest to train and calibrate probability outputs.",
      "Lowest overall accuracy (0.7474).",
    ],
    bestUseCase: "High-sensitivity screening over precision trade-offs.",
    predictedThroughput: "Slowest inference",
    hyperparams: [
      { label: "kernel", value: "'rbf'" },
      { label: "C", value: "1.0" },
      { label: "gamma", value: "'scale'" },
      { label: "probability", value: "True" },
      { label: "random_state", value: "42" },
    ],
    preprocessing: [
      "SMOTE balancing of training set (22928 samples)",
      "44 final features, nonlinear decision boundary",
    ],
    notebookId: "08_Support_Vector_Machine.ipynb",
  },
];

/* ==========================================================
   Metrics that were evaluated (used in comparison table)
   ========================================================== */
export const metricKeys = [
  "accuracy",
  "precision",
  "recall",
  "f1",
  "rocAuc",
  "mcc",
  "kappa",
] as const;

export const metricLabels: Record<(typeof metricKeys)[number], string> = {
  accuracy: "Accuracy",
  precision: "Precision",
  recall: "Recall",
  f1: "F1 Score",
  rocAuc: "ROC AUC",
  mcc: "MCC",
  kappa: "Kappa",
};

/* ==========================================================
   Pipeline (Horizontal) — from the deployment workflow
   ========================================================== */
export const pipelineSteps: PipelineStep[] = [
  { icon: Database, title: "Dataset", detail: "NHANES 2017–20" },
  { icon: Workflow, title: "Cleaning", detail: "Validation & imputation" },
  { icon: GitBranch, title: "Feature Engineering", detail: "Encoding + normalization" },
  { icon: GitFork, title: "Feature Selection", detail: "44 consensus features" },
  { icon: LineChart, title: "Train-Test Split", detail: "80/20 stratified" },
  { icon: Brain, title: "Model Training", detail: "4 algorithms" },
  { icon: Shield, title: "Evaluation", detail: "7 metrics" },
  { icon: GitFork, title: "Comparison", detail: "ROC-AUC ranking" },
  { icon: Cpu, title: "Best Model", detail: "Random Forest" },
  { icon: Workflow, title: "Deployment", detail: "Production inference" },
];

/* ==========================================================
   Feature selection (Notebook 04) — consensus approach
   ========================================================== */
export const featureConsensus = [
  { feature: "BMXWT", rf: true, mi: true, lasso: true },
  { feature: "BMXWAIST", rf: true, mi: true, lasso: true },
  { feature: "BPQ020", rf: true, mi: true, lasso: true },
  { feature: "BPQ090D", rf: true, mi: true, lasso: true },
  { feature: "LBXGH", rf: true, mi: true, lasso: true },
  { feature: "MCQ160A", rf: true, mi: true, lasso: true },
  { feature: "PAD680", rf: true, mi: true, lasso: true },
  { feature: "RIDAGEYR", rf: true, mi: true, lasso: true },
  { feature: "SMQ856", rf: true, mi: true, lasso: true },
  { feature: "LBXBCD", rf: true, mi: true, lasso: true },
];

/* RF feature importance (Notebook 06) */
export const randomForestImportance = [
  { feature: "RIDAGEYR", importance: 0.0595 },
  { feature: "BPQ020", importance: 0.0431 },
  { feature: "URXUCD", importance: 0.0299 },
  { feature: "BPQ090D", importance: 0.0294 },
  { feature: "LBXGLU", importance: 0.0252 },
  { feature: "LBXNFOS", importance: 0.0232 },
  { feature: "SMQ856", importance: 0.0194 },
  { feature: "LBXPFNA", importance: 0.0189 },
  { feature: "LBXMFOS", importance: 0.0186 },
  { feature: "LBXNFOA", importance: 0.0179 },
];

/* Mutual Information (from Outputs/Mutual_Information.csv) */
export const mutualInformation = [
  { feature: "RIDAGEYR", value: 0.0731 },
  { feature: "URXUCD", value: 0.0634 },
  { feature: "LBXNFOS", value: 0.061 },
  { feature: "LBXMFOS", value: 0.0574 },
  { feature: "LBXGLU", value: 0.0547 },
];

/* LASSO coefficients (from Outputs/LASSO_Selected_Features.csv) */
export const lassoImportance = [
  { feature: "RIDAGEYR", value: 1.2487 },
  { feature: "SMQ856", value: 0.4004 },
  { feature: "BPQ020", value: 0.2801 },
  { feature: "BPQ090D", value: 0.1535 },
  { feature: "LBXTC", value: 0.1502 },
  { feature: "LBXGH", value: 0.1019 },
];

/* ==========================================================
   Notebook mapping — role in the model development lifecycle
   ========================================================== */
export const notebooks = [
  { id: "01", title: "Data Validation & EDA", role: "Validate the raw NHANES intake and explore the CVD signal." },
  { id: "02", title: "Data Dictionary & Variable Grouping", role: "Build the canonical dictionary and group variables into clinical, dietary and genomic domains." },
  { id: "03", title: "Feature Engineering & Preprocessing", role: "Impute, encode and normalize the full feature matrix into an ML-ready dataset." },
  { id: "04", title: "Train-Test Split & Feature Selection", role: "Stratified 80/20 split plus RF, MI & LASSO consensus selection of 44 features." },
  { id: "05", title: "Logistic Regression", role: "Train the linear baseline and evaluate clinical performance." },
  { id: "06", title: "Random Forest", role: "Fit the 500-tree ensemble and explore feature importance." },
  { id: "07", title: "XGBoost", role: "Boost gradient trees with tuned hyperparameters." },
  { id: "08", title: "Support Vector Machine", role: "Benchmark the RBF-kernel SVM against the ensemble baselines." },
  { id: "09", title: "Model Comparison", role: "Compare all four models on ROC-AUC, accuracy and clinical thresholds." },
  { id: "10", title: "Final Report & Interpretation", role: "Produce the consolidated results table and interpretation." },
  { id: "11", title: "Food & Supplement Feature Engineering", role: "Extend the feature set with dietary and supplement variables." },
  { id: "12", title: "Explainable AI", role: "SHAP summary, waterfall and dependence plots on the final model." },
  { id: "13", title: "Deployment & Clinical Risk Prediction", role: "Package the champion model and generate per-patient risk categories." },
];

/* ==========================================================
   Research insights (derived from notebook conclusions)
   ========================================================== */
export const researchInsights = [
  {
    title: "Random Forest wins on ROC-AUC",
    body: "With ROC-AUC 0.9051, Random Forest bests all baselines, driving the research deployment decision.",
  },
  {
    title: "Accuracy vs. minority recall",
    body: "XGBoost reaches 0.9091 accuracy but only catches 0.33 of CVD cases — a critical clinical gap.",
  },
  {
    title: "SVM: high sensitivity, low precision",
    body: "SVM recalls 0.92 of positives but at 0.213 precision, flooding clinicians with false alarms.",
  },
  {
    title: "Why some models underperform",
    body: "Linear (LR) cannot capture non-linear interactions; SVM struggles with imbalanced, high-dimensional data.",
  },
];

export const finalConclusion =
  "Random Forest balances discrimination (ROC-AUC 0.9051), practical accuracy (0.9017), and clinically interpretable feature importance — making it the research champion for cardiovascular disease risk prediction in CardioInsight AI.";

/* ==========================================================
   Technical details
   ========================================================== */
export const technicalDetails = [
  {
    title: "Development Environment",
    icon: "environment",
    rows: [
      ["Language", "Python 3"],
      ["Runtime", "Local Jupyter notebooks (scikit-learn ecosystem)"],
      ["Serialization", ".pkl via joblib"],
      ["Evaluation split", "Stratified train/test (Train 12,365 · Test 3,092)"],
    ],
  },
  {
    title: "Libraries & Frameworks",
    icon: "libraries",
    rows: [
      ["scikit-learn", "Random Forest, Logistic Regression, SVM, metrics, train_test_split"],
      ["XGBoost", "Gradient-boosted trees (XGBClassifier)"],
      ["imbalanced-learn", "SMOTE oversampling for class imbalance"],
      ["SHAP", "TreeExplainer summary + dependence explainable AI"],
      ["Plotting", "Matplotlib / Seaborn ROC, confusion & bar charts"],
      ["Data", "NumPy arrays & Pandas feature engineering"],
    ],
  },
];

/* Figure paths copied from Outputs/*.png into the frontend public/ */
export const figures = {
  accuracy: "/assets/models/Accuracy_Comparison.png",
  rocAuc: "/assets/models/ROC_AUC_Comparison.png",
  f1: "/assets/models/F1_Comparison.png",
  rocComparison: "/assets/models/ROC_Comparison.png",
};