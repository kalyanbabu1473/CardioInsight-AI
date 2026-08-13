import {
  Users,
  Database,
  Target,
} from "lucide-react";

import { projectInfo } from "./project";

export const dashboardMetrics = [
  {
    title: "Participants",
    value: projectInfo.participants.toLocaleString(),
    subtitle: "NHANES Participants",
    icon: Users,
    color: "#3B82F6",
  },

  {
    title: "Initial Features",
    value: projectInfo.initialFeatures.toString(),
    subtitle: "Training Variables",
    icon: Database,
    color: "#60A5FA",
  },

  {
    title: "Selected Features",
    value: projectInfo.selectedFeatures.toString(),
    subtitle: "Reduced Feature Set",
    icon: Database,
    color: "#93C5FD",
  },

  {
    title: "Target",
    value: projectInfo.target,
    subtitle: "Prediction Target",
    icon: Target,
    color: "#2563EB",
  },
];