import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui";

import type { JourneyNotebook } from "./journeyData";

import styles from "./ResearchJourney.module.css";

interface NotebookCardProps {
  notebook: JourneyNotebook;
}

export default function NotebookCard({ notebook }: NotebookCardProps) {
  const isComplete = notebook.status === "completed";

  const accentStyle = {
    "--accent": notebook.accent,
  } as CSSProperties;

  return (
    <Link
      to={notebook.href}
      className={styles.card}
      style={accentStyle}
      aria-label={`${notebook.id}: ${notebook.title} - ${isComplete ? "Completed" : "In Progress"}`}
    >
      <div className={styles.cardTop}>
        <span className={styles.id}>{notebook.id}</span>

        <Badge variant={isComplete ? "success" : "warning"}>
          {isComplete ? (
            <CheckCircle2 size={12} />
          ) : (
            <Clock size={12} />
          )}
          {isComplete ? "Completed" : "In Progress"}
        </Badge>
      </div>

      <h3 className={styles.title}>{notebook.title}</h3>

      <p className={styles.description}>{notebook.description}</p>

      <div className={styles.cardFooter}>
        <span className={styles.phase}>{notebook.phase}</span>
        <ArrowUpRight className={styles.open} size={16} />
      </div>
    </Link>
  );
}