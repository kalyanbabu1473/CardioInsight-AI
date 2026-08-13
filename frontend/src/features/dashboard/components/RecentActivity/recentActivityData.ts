import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Database,
  GitBranch,
} from "lucide-react";

export interface RecentActivityItem {
  id: number;
  icon: LucideIcon;
  title: string;
  detail: string;
  time: string;
  tone: string;
}

export const recentActivity: RecentActivityItem[] = [
  {
    id: 1,
    icon: CheckCircle2,
    title: "Notebook 13 evaluation completed",
    detail: "ROC AUC logged for the best model",
    time: "2h ago",
    tone: "#3B82F6",
  },
  {
    id: 2,
    icon: Database,
    title: "Feature matrix exported",
    detail: "44 selected features finalized",
    time: "5h ago",
    tone: "#60A5FA",
  },
  {
    id: 3,
    icon: BrainCircuit,
    title: "Model comparison updated",
    detail: "4 algorithms benchmarked on test split",
    time: "1d ago",
    tone: "#2563EB",
  },
  {
    id: 4,
    icon: GitBranch,
    title: "Preprocessing pipeline validated",
    detail: "Train/test split confirmed stable",
    time: "2d ago",
    tone: "#38BDF8",
  },
  {
    id: 5,
    icon: Activity,
    title: "Prediction API configured",
    detail: "Risk endpoint ready for integration",
    time: "3d ago",
    tone: "#93C5FD",
  },
];