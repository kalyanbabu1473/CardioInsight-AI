import type { ReactNode } from "react";

export interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}