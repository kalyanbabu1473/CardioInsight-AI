import type { HTMLAttributes, ReactNode } from "react";

export interface GlassPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;

  blur?: "sm" | "md" | "lg";

  opacity?: "light" | "medium" | "strong";
}