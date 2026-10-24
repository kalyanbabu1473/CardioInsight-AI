/// <reference types="vite/client" />

/*
 * GENERATED FILE - do not edit by hand. Real global feature importances
 * (Gini importance on the deployed forest) extracted from the model.
 * Regenerate with scripts/extract_importances.py.
 */

export interface ImportanceRow {
  name: string;
  importance: number;
  description: string;
  note: string;
}

export const featureImportance: ImportanceRow[] = [
  {
    name: "RIDAGEYR - Age",
    importance: 0.2273,
    description: "Age in years (right-censored at 80 in training).",
    note: "Share of total model importance: 22.7%.",
  },
  {
    name: "BPQ020 - High blood pressure diagnosis",
    importance: 0.1104,
    description: "Ever told by a doctor you had high blood pressure (Yes=1, No=2).",
    note: "Share of total model importance: 11.0%.",
  },
  {
    name: "LBXGLU - Fasting glucose",
    importance: 0.0861,
    description: "Fasting serum glucose.",
    note: "Share of total model importance: 8.6%.",
  },
  {
    name: "BMXWAIST - Waist circumference",
    importance: 0.0683,
    description: "Measured waist circumference.",
    note: "Share of total model importance: 6.8%.",
  },
  {
    name: "BPXOSY1 - Systolic blood pressure",
    importance: 0.0643,
    description: "First systolic blood pressure reading.",
    note: "Share of total model importance: 6.4%.",
  },
  {
    name: "LBXGH - HbA1c / glycated hemoglobin",
    importance: 0.0582,
    description: "Glycohemoglobin from whole blood.",
    note: "Share of total model importance: 5.8%.",
  },
  {
    name: "LBXTR - Triglycerides",
    importance: 0.0537,
    description: "Serum triglycerides.",
    note: "Share of total model importance: 5.4%.",
  },
  {
    name: "LBXTC - Total cholesterol",
    importance: 0.0461,
    description: "Total serum cholesterol.",
    note: "Share of total model importance: 4.6%.",
  },
  {
    name: "BMXWT - Weight",
    importance: 0.0436,
    description: "Measured body weight.",
    note: "Share of total model importance: 4.4%.",
  },
  {
    name: "BMXHT - Height",
    importance: 0.0434,
    description: "Standing height.",
    note: "Share of total model importance: 4.3%.",
  },
  {
    name: "BMXBMI - Body mass index",
    importance: 0.0382,
    description: "Derived from height and weight (kg/m^2).",
    note: "Share of total model importance: 3.8%.",
  },
  {
    name: "BPXODI1 - Diastolic blood pressure",
    importance: 0.0355,
    description: "First diastolic blood pressure reading.",
    note: "Share of total model importance: 3.5%.",
  },
  {
    name: "LBDLDL - LDL cholesterol",
    importance: 0.0341,
    description: "Direct low-density lipoprotein cholesterol.",
    note: "Share of total model importance: 3.4%.",
  },
  {
    name: "LBDHDD - HDL cholesterol",
    importance: 0.0340,
    description: "Direct high-density lipoprotein cholesterol.",
    note: "Share of total model importance: 3.4%.",
  },
  {
    name: "LBXIN - Fasting insulin",
    importance: 0.0274,
    description: "Fasting serum insulin.",
    note: "Share of total model importance: 2.7%.",
  },
];

export const importanceTopShare = 0.9706;
