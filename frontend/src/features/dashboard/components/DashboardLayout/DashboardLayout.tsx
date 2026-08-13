import type { ReactNode } from "react";
import styles from "./DashboardLayout.module.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className={styles.dashboard}>
      {children}
    </div>
  );
}