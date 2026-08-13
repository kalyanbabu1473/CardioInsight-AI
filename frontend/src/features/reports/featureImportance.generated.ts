/// <reference types="vite/client" />

/*
 * GENERATED FILE — do not edit by hand. Real global feature importances
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
    name: "BPQ020 — High blood pressure diagnosis",
    importance: 0.1245,
    description: "Ever told had high blood pressure (1=Yes, 2=No).",
    note: "Share of total model importance: 12.5%.",
  },
  {
    name: "BPQ090D — Prescribed meds for high cholesterol",
    importance: 0.1043,
    description: "Ever told to take prescription medicine for high cholesterol (1=Yes, 2=No).",
    note: "Share of total model importance: 10.4%.",
  },
  {
    name: "MCQ160A — Arthritis diagnosis",
    importance: 0.0813,
    description: "Ever told by a doctor had arthritis (1=Yes, 2=No).",
    note: "Share of total model importance: 8.1%.",
  },
  {
    name: "RIDAGEYR — Age",
    importance: 0.0673,
    description: "Age in years (right-censored at 80 in training).",
    note: "Share of total model importance: 6.7%.",
  },
  {
    name: "BPQ080 — High cholesterol diagnosis",
    importance: 0.0645,
    description: "Ever told had high cholesterol (1=Yes, 2=No).",
    note: "Share of total model importance: 6.4%.",
  },
  {
    name: "URXUCD — Urinary cadmium",
    importance: 0.0469,
    description: "Cadmium in urine.",
    note: "Share of total model importance: 4.7%.",
  },
  {
    name: "LBXPFNA — PFNA",
    importance: 0.0463,
    description: "Perfluorononanoic acid in serum.",
    note: "Share of total model importance: 4.6%.",
  },
  {
    name: "LBXMFOS — Sm-PFOS",
    importance: 0.0435,
    description: "Perfluoromethylheptane sulfonic acid isomers (Sm-PFOS) in serum.",
    note: "Share of total model importance: 4.3%.",
  },
  {
    name: "LBXNFOS — PFOS",
    importance: 0.0290,
    description: "Perfluorooctane sulfonic acid in serum.",
    note: "Share of total model importance: 2.9%.",
  },
  {
    name: "LBXGH — HbA1c / glycated hemoglobin",
    importance: 0.0252,
    description: "Glycohemoglobin from whole blood.",
    note: "Share of total model importance: 2.5%.",
  },
  {
    name: "LBXGLU — Fasting glucose",
    importance: 0.0209,
    description: "Fasting serum glucose.",
    note: "Share of total model importance: 2.1%.",
  },
  {
    name: "LBXBCD — Blood cadmium",
    importance: 0.0188,
    description: "Cadmium in whole blood.",
    note: "Share of total model importance: 1.9%.",
  },
  {
    name: "LBXNFOA — PFOA",
    importance: 0.0186,
    description: "n-Perfluorooctanoic acid in serum.",
    note: "Share of total model importance: 1.9%.",
  },
  {
    name: "URXBDCP — Urinary BDCPP",
    importance: 0.0184,
    description: "Bis(1,3-dichloro-2-propyl) phosphate in urine.",
    note: "Share of total model importance: 1.8%.",
  },
  {
    name: "INDFMPIR — Income-to-poverty ratio",
    importance: 0.0163,
    description: "Ratio of family income to the federal poverty guideline: 1.0 means income equals the poverty line, lower values mean income below it, higher values mean more comfortable income (0-5).",
    note: "Share of total model importance: 1.6%.",
  },
];

export const importanceTopShare = 0.7259;
