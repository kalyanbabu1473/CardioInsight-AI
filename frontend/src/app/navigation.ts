import { Palette } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  BrainCircuit,
  Activity,
  FileText,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Project",
    path: "/project",
    icon: FolderKanban,
  },
  {
    title: "Dataset",
    path: "/dataset",
    icon: Database,
  },
  {
    title: "Explainability",
    path: "/explainability",
    icon: BrainCircuit,
  },
  {
    title: "Assessment",
    path: "/assessment",
    icon: Activity,
  },
  {
    title: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    title: "UI Kit",
    path: "/ui",
    icon: Palette,
  },
];