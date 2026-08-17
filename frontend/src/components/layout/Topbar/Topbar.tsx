import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../../app/useTheme";
import GlobalSearch from "../GlobalSearch";
import { routeMeta } from "../../../routes/routeConfig";
import styles from "./Topbar.module.css";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const isDark = theme === "dark";

  const meta = routeMeta[pathname] ?? { title: "CardioInsight AI", crumb: "Platform" };

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <div className={styles.left}>
        <div>
          <p className={styles.breadcrumb}>{meta.crumb}</p>
          <h1 className={styles.title}>{meta.title}</h1>
        </div>
      </div>

      <div className={styles.center}>
        <GlobalSearch />
      </div>

      <div className={styles.right}>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
        </button>

        <button
          type="button"
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}