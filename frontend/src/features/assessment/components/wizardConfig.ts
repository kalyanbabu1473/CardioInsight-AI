import {
  ClipboardCheck,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  Landmark,
  Microscope,
  Ruler,
  ShieldAlert,
  TestTube,
  User,
  VenetianMask,
  type LucideIcon,
} from "lucide-react";

import { CATEGORY_LABELS, type CategoryKey } from "@/data/assessment/featureContract";

export interface WizardStepDef {
  index: number;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Contract section this step collects; undefined for the final review step. */
  category?: CategoryKey;
}

export const REVIEW_STEP = 12;

export const WIZARD_STEPS: WizardStepDef[] = [
  {
    index: 1,
    label: CATEGORY_LABELS.demographics,
    description: "Demographic baseline",
    icon: User,
    category: "demographics",
  },
  {
    index: 2,
    label: CATEGORY_LABELS.bodyComposition,
    description: "Anthropometric data",
    icon: Ruler,
    category: "bodyComposition",
  },
  {
    index: 3,
    label: CATEGORY_LABELS.bloodPressure,
    description: "Hemodynamic status",
    icon: HeartPulse,
    category: "bloodPressure",
  },
  {
    index: 4,
    label: CATEGORY_LABELS.metabolic,
    description: "Glucose and insulin panel",
    icon: FlaskConical,
    category: "metabolic",
  },
  {
    index: 5,
    label: CATEGORY_LABELS.lipids,
    description: "Cholesterol panel",
    icon: Microscope,
    category: "lipids",
  },
  {
    index: 6,
    label: CATEGORY_LABELS.environmentalToxins,
    description: "Heavy metals in blood and urine",
    icon: ShieldAlert,
    category: "environmentalToxins",
  },
  {
    index: 7,
    label: CATEGORY_LABELS.pfas,
    description: "Persistent organic pollutants",
    icon: TestTube,
    category: "pfas",
  },
  {
    index: 8,
    label: CATEGORY_LABELS.urinaryOpes,
    description: "Flame-retardant metabolites",
    icon: TestTube,
    category: "urinaryOpes",
  },
  {
    index: 9,
    label: CATEGORY_LABELS.medicalHistory,
    description: "Diagnoses and medication",
    icon: VenetianMask,
    category: "medicalHistory",
  },
  {
    index: 10,
    label: CATEGORY_LABELS.lifestyle,
    description: "Behavioral risk factors",
    icon: Dumbbell,
    category: "lifestyle",
  },
  {
    index: 11,
    label: CATEGORY_LABELS.socioeconomic,
    description: "Income context",
    icon: Landmark,
    category: "socioeconomic",
  },
  {
    index: REVIEW_STEP,
    label: "Review",
    description: "Confirm patient record",
    icon: ClipboardCheck,
  },
];