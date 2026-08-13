import type { CSSProperties } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui";

import { journeyData } from "@/features/dashboard/components/ResearchJourney/journeyData";

import styles from "./NotebookDetailPage.module.css";

export default function NotebookDetailPage() {
  const { notebookId } = useParams();
  const index = journeyData.findIndex((notebook) => notebook.id === notebookId);
  const notebook = journeyData[index];

  if (!notebook) {
    return <Navigate to="/project" replace />;
  }

  const isComplete = notebook.status === "completed";
  const prev = journeyData[index - 1];
  const next = journeyData[index + 1];

  const accentStyle = {
    "--accent": notebook.accent,
  } as CSSProperties;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        <ArrowLeft size={16} />
        Back to Research Journey
      </Link>

      <header className={styles.hero} style={accentStyle}>
        <div className={styles.heroTop}>
          <span className={styles.badge}>{notebook.phase}</span>
          <span className={styles.id}>{notebook.id}</span>
        </div>

        <h1 className={styles.title}>{notebook.title}</h1>

        <p className={styles.description}>{notebook.description}</p>

        <Badge variant={isComplete ? "success" : "warning"}>
          {isComplete ? "Completed" : "In Progress"}
        </Badge>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2>Notebook Details</h2>

          <dl className={styles.list}>
            <div>
              <dt>Notebook</dt>
              <dd>{notebook.id}</dd>
            </div>
            <div>
              <dt>Phase</dt>
              <dd>{notebook.phase}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{isComplete ? "Completed" : "In Progress"}</dd>
            </div>
            <div>
              <dt>Journey</dt>
              <dd>
                Step {index + 1} of {journeyData.length}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.panel}>
          <h2>Contents</h2>

          <p className={styles.placeholder}>
            The full notebook contents for {notebook.id} will be rendered here,
            including code, outputs, and research insights.
          </p>
        </section>
      </div>

      <nav className={styles.nav}>
        {prev ? (
          <Link to={prev.href} className={styles.navLink}>
            <ArrowLeft size={16} />
            <span>
              <small>Previous</small>
              {prev.id} - {prev.title}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}

        {next ? (
          <Link to={next.href} className={styles.navLink}>
            <span>
              <small>Next</small>
              {next.id} - {next.title}
            </span>
            <ArrowRight size={16} />
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </nav>
    </div>
  );
}