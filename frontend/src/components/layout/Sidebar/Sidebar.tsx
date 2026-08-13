import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  BrainCircuit,
  Cpu,
  Activity,
  FileText,
  Settings,
} from "lucide-react";

import { useAssessment } from "@/features/assessment/useAssessment";

import styles from "./Sidebar.module.css";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Project", path: "/project", icon: FolderKanban },
  { label: "Dataset", path: "/dataset", icon: Database },
  { label: "Models", path: "/models", icon: Cpu },
  { label: "Explainability", path: "/explainability", icon: BrainCircuit },
  { label: "Assessment", path: "/assessment", icon: Activity },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const { hasSessionAssessment } = useAssessment();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>CardioInsight AI</h2>
        <span>CVD Risk Intelligence Platform</span>
      </div>

      <nav className={styles.nav}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isAssessment = item.path === "/assessment";
          const needsAttention = isAssessment && !hasSessionAssessment;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  styles.link,
                  isActive ? styles.active : "",
                  needsAttention ? styles.attention : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-glow"
                      className={styles.activeGlow}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 30,
                        mass: 0.9,
                      }}
                    >
                      <span className={styles.flow} aria-hidden="true" />
                    </motion.span>
                  )}

                  {needsAttention && (
                    <motion.span
                      className={styles.startPulse}
                      key={isAssessment ? "assessment-pulse" : undefined}
                      animate={{ scale: [1, 1.06, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{
                        duration: 1.8,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }}
                      aria-hidden="true"
                    />
                  )}

                  <Icon className={styles.navIcon} size={20} />
                  <span className={styles.label}>{item.label}</span>

                  {needsAttention && (
                    <motion.span
                      className={styles.badge}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      data-start-badge
                    >
                      Start
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.profile}>
          <div className={styles.avatar}>KB</div>
          <div className={styles.profileMeta}>
            <strong>Kalyan Babu</strong>
            <p>Researcher</p>
          </div>
        </div>
      </div>
    </aside>
  );
}