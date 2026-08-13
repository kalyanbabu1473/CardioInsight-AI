import type { ReactNode } from "react";

export interface DashboardWidgetProps {
  title: string;
  actionLabel?: string;
  onActionClick?: () => void;
  children: ReactNode;
}