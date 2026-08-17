import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useLocation } from "react-router-dom";

import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  return (
    <div className={styles.shell}>
      <Sidebar open={drawerOpen} onNavigate={closeDrawer} />

      {drawerOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={closeDrawer}
          aria-label="Close navigation menu"
          tabIndex={-1}
        />
      )}

      <div className={styles.main}>
        <Topbar onMenuClick={openDrawer} />

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}