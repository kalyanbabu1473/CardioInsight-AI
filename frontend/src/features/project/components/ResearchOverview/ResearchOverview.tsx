import {
  Target,
  Database,
  BrainCircuit,
  Trophy,
} from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";

import styles from "./ResearchOverview.module.css";

const cards = [
  {
    icon: <Target size={26} />,
    title: "Research Objective",
    text:
      "Develop a robust machine learning framework to predict cardiovascular disease risk using demographic, lifestyle, dietary, laboratory, and environmental variables from NHANES.",
  },
  {
    icon: <Database size={26} />,
    title: "Dataset",
    text:
      "NHANES 2017–2020 Pre-Pandemic dataset containing 15,560 participants and 647 variables after data integration and preprocessing.",
  },
  {
    icon: <BrainCircuit size={26} />,
    title: "Methodology",
    text:
      "Data cleaning, feature engineering, feature selection, machine learning model development, model evaluation, and explainable prediction.",
  },
  {
    icon: <Trophy size={26} />,
    title: "Outcome",
    text:
      "A production-ready cardiovascular disease risk prediction platform built with React, Python, and modern machine learning techniques.",
  },
];

export default function ResearchOverview() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.heading}>
          <h2>Research Overview</h2>

          <p>
            This project transforms raw NHANES health records into an intelligent
            machine learning system capable of supporting cardiovascular disease
            risk assessment.
          </p>
        </div>
      </Reveal>

      <Stagger className={styles.grid}>
        {cards.map((card) => (
          <StaggerItem
            key={card.title}
            className={styles.card}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
          >
            <div className={styles.icon}>{card.icon}</div>

            <h3>{card.title}</h3>

            <p>{card.text}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}