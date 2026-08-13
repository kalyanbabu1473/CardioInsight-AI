export interface MetricValue {
  label: string;
  value: string;
}

export interface RocPoint {
  x: number;
  y: number;
}

export const modelPerformance = {
  bestModel: "Random Forest",

  metrics: [
    {
      label: "Accuracy",
      value: "90.17%",
    },
    {
      label: "Precision",
      value: "36.14%",
    },
    {
      label: "Recall",
      value: "45.78%",
    },
    {
      label: "F1 Score",
      value: "40.39%",
    },
    {
      label: "ROC AUC",
      value: "0.9051",
    },
  ] satisfies MetricValue[],

  details: [
    {
      label: "MCC",
      value: "0.3541",
    },
    {
      label: "Cohen's Kappa",
      value: "0.3512",
    },
  ] satisfies MetricValue[],

  summary:
    "Random Forest was selected as the final model because it achieved the highest ROC-AUC (0.9051), providing the best overall balance between sensitivity and specificity for cardiovascular disease risk prediction.",

  roc: [
    { x: 0.0, y: 0.0 },
    { x: 0.0073, y: 0.2806 },
    { x: 0.0113, y: 0.3359 },
    { x: 0.0167, y: 0.3951 },
    { x: 0.0245, y: 0.4568 },
    { x: 0.0349, y: 0.5196 },
    { x: 0.0489, y: 0.5819 },
    { x: 0.0671, y: 0.6422 },
    { x: 0.0901, y: 0.6991 },
    { x: 0.1186, y: 0.7516 },
    { x: 0.1529, y: 0.7987 },
    { x: 0.1931, y: 0.84 },
    { x: 0.2391, y: 0.8754 },
    { x: 0.2907, y: 0.9049 },
    { x: 0.3469, y: 0.9289 },
    { x: 0.4066, y: 0.9479 },
    { x: 0.4685, y: 0.9627 },
    { x: 0.5314, y: 0.9738 },
    { x: 0.5934, y: 0.982 },
    { x: 0.6532, y: 0.9879 },
    { x: 0.7094, y: 0.9921 },
    { x: 0.7608, y: 0.9949 },
    { x: 0.8069, y: 0.9968 },
    { x: 0.847, y: 0.998 },
    { x: 0.8814, y: 0.9988 },
    { x: 0.9099, y: 0.9993 },
    { x: 0.9329, y: 0.9996 },
    { x: 0.951, y: 0.9998 },
    { x: 0.9651, y: 0.9999 },
    { x: 0.9755, y: 0.9999 },
    { x: 0.9833, y: 1.0 },
    { x: 0.9889, y: 1.0 },
    { x: 0.9927, y: 1.0 },
    { x: 1.0, y: 1.0 },
  ] satisfies RocPoint[],
};