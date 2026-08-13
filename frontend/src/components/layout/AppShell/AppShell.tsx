import type { ReactNode } from "react";

import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.main}>
        <Topbar />

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}