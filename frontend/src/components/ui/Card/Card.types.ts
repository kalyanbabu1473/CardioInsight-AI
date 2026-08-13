import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;

  variant?: "default" | "glass" | "elevated" | "interactive";

  className?: string;
}