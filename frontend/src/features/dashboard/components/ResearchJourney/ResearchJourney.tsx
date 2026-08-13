import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import LogoLoop from "@/components/motion/LogoLoop";

import NotebookCard from "./NotebookCard";
import { journeyData } from "./journeyData";

import styles from "./ResearchJourney.module.css";

export default function ResearchJourney() {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>Research Journey</h2>

        <button
          onClick={() => navigate("/project")}
          className={styles.action}
        >
          View Pipeline

          <ChevronRight size={16} />
        </button>
      </header>

      <LogoLoop
        className={styles.carousel}
        speed={52}
        gap={24}
        pauseOnHover
        fadeEdges
        ariaLabel="Research notebook journey"
      >
        {journeyData.map((notebook) => (
          <NotebookCard key={notebook.id} notebook={notebook} />
        ))}
      </LogoLoop>
    </section>
  );
}