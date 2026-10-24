import {
  ClipboardCheck,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  Microscope,
  Ruler,
  User,
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

export const REVIEW_STEP = 7;

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
    label: CATEGORY_LABELS.lifestyle,
    description: "Behavioral risk factors",
    icon: Dumbbell,
    category: "lifestyle",
  },
  {
    index: REVIEW_STEP,
    label: "Review",
    description: "Confirm patient record",
    icon: ClipboardCheck,
  },
];
