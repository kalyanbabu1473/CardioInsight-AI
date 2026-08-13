import DashboardPage from "../features/dashboard/DashboardPage";
import ProjectPage from "../features/project/ProjectPage";
import DatasetPage from "../features/dataset/DatasetPage";
import ModelsPage from "../features/models/ModelsPage";
import ExplainabilityPage from "../features/explainability/ExplainabilityPage";
import SettingsPage from "../features/settings/SettingsPage";
import UIShowcasePage from "../features/ui-showcase/UIShowcasePage";
import NotebookDetailPage from "../features/notebooks/NotebookDetailPage";

import { SkeletonPage } from "@/components/ui/Skeleton";

import { ReportsRoute, AssessmentRoute } from "./dataRoutes";

export const routes = [
  {
    path: "/",
    element: (
      <SkeletonPage variant="dashboard">
        <DashboardPage />
      </SkeletonPage>
    ),
  },
  {
    path: "/notebooks/:notebookId",
    element: <NotebookDetailPage />,
  },
  {
    path: "/project",
    element: (
      <SkeletonPage variant="project">
        <ProjectPage />
      </SkeletonPage>
    ),
  },
  {
    path: "/dataset",
    element: (
      <SkeletonPage variant="dataset">
        <DatasetPage />
      </SkeletonPage>
    ),
  },
  {
    path: "/models",
    element: (
      <SkeletonPage variant="models">
        <ModelsPage />
      </SkeletonPage>
    ),
  },
  {
    path: "/explainability",
    element: (
      <SkeletonPage variant="explainability">
        <ExplainabilityPage />
      </SkeletonPage>
    ),
  },
  {
    path: "/assessment",
    element: <AssessmentRoute />,
  },
  {
    path: "/reports",
    element: <ReportsRoute />,
  },
  {
    path: "/settings",
    element: (
      <SkeletonPage variant="settings">
        <SettingsPage />
      </SkeletonPage>
    ),
  },
  {
  path: "/ui",
  element: <UIShowcasePage />,
  },
];

/** Page titles + breadcrumb labels used by the Topbar. */
export const routeMeta: Record<string, { title: string; crumb: string }> = {
  "/": { title: "CardioInsight AI", crumb: "Dashboard" },
  "/project": { title: "Project", crumb: "Project" },
  "/dataset": { title: "Dataset", crumb: "Dataset" },
  "/models": { title: "Models", crumb: "Models" },
  "/explainability": { title: "Explainability", crumb: "Explainability" },
  "/assessment": { title: "Assessment", crumb: "Assessment" },
  "/reports": { title: "Reports", crumb: "Reports" },
  "/settings": { title: "Settings", crumb: "Settings" },
  "/ui": { title: "UI Kit", crumb: "UI Kit" },
};