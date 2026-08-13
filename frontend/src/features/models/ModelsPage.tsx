import {
  BarChart3,
  Boxes,
  BookOpen,
  FileCode2,
  GitBranch,
  GraduationCap,
  Layers,
  ListChecks,
  Network,
  Rocket,
  ScanSearch,
  Settings2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";

import SectionHeading from "./components/SectionHeading";
import ModelComparisonCards from "./components/ModelComparisonCards";
import ComparisonTable from "./components/ComparisonTable";
import ModelDetails from "./components/ModelDetails";
import Pipeline from "./components/Pipeline";
import FeatureUsage from "./components/FeatureUsage";
import EvaluationDashboard from "./components/EvaluationDashboard";
import BestModelSection from "./components/BestModelSection";
import NotebookMapping from "./components/NotebookMapping";
import ResearchInsights from "./components/ResearchInsights";
import TechnicalDetails from "./components/TechnicalDetails";

import { datasetContext, models } from "./modelsData";

import styles from "./ModelsPage.module.css";

const bestModel = models.find((m) => m.id === "random-forest")!;

const stats: { icon: LucideIcon; value: string; label: string }[] = [
  {
    icon: Layers,
    value: String(models.length),
    label: "Models Compared",
  },
  {
    icon: Trophy,
    value: bestModel.name,
    label: "Production Model",
  },
  {
    icon: Sparkles,
    value: (bestModel.metrics.find((m) => m.label === "ROC AUC")!.value * 100).toFixed(2) + "%",
    label: "Best ROC-AUC",
  },
  {
    icon: Boxes,
    value: String(datasetContext.selectedFeatures),
    label: "Selected Features",
  },
  {
    icon: GraduationCap,
    value: String(datasetContext.participants).toLocaleString(),
    label: "NHANES Participants",
  },
  {
    icon: ScanSearch,
    value: String(datasetContext.testSamples).toLocaleString(),
    label: "Test Samples",
  },
];

export default function ModelsPage() {
  return (
    <div className={styles.page}>
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.content}>
          <span className={styles.badge}>Model Development</span>
          <h1 className={styles.title}>The Models</h1>
          <p className={styles.description}>
            Four supervised machine-learning classifiers trained on NHANES
            2017&ndash;2020 clinical data to predict composite cardiovascular
            disease risk &mdash; benchmarked, tuned and evaluated end-to-end, with
            Random Forest as the research champion (deployed as the 20-feature
            CardioAI Assessment Model).
          </p>
        </div>
      </motion.section>

      <Stagger className={styles.statGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <StaggerItem key={stat.label} className={styles.statCard}>
              <div className={styles.statIcon}>
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className={styles.statMeta}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal>
        <section className={styles.section}>
          <SectionHeading
            icon={BarChart3}
            title="Model Comparison"
            subtitle="Side-by-side benchmark of the four trained classifiers"
            badge="4 Models"
          />
          <ModelComparisonCards />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={ListChecks}
            title="Interactive Metrics Table"
            subtitle="Search, sort and filter the full evaluation matrix"
            badge="Sortable"
          />
          <ComparisonTable />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={Settings2}
            title="Model Details & Hyperparameters"
            subtitle="Configuration, training status and notes for every model"
          />
          <ModelDetails />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={GitBranch}
            title="Training Pipeline"
            subtitle="The full ML workflow from raw NHANES data to prediction"
            badge="10 Stages"
          />
          <Pipeline />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={Network}
            title="Feature Usage Across Models"
            subtitle="The 44 selected features and how each model weights them"
            badge="44 Features"
          />
          <FeatureUsage />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={BarChart3}
            title="Evaluation Dashboard"
            subtitle="Metrics, confusion matrices and the actual notebook evaluation plots"
            badge="Real Outputs"
          />
          <EvaluationDashboard />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={Trophy}
            title="Best Model — Random Forest"
            subtitle="Why the research champion was chosen"
            badge="Champion"
          />
          <BestModelSection />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={BookOpen}
            title="Notebook Mapping"
            subtitle="Every notebook in the project and the role it plays"
            badge="13 Notebooks"
          />
          <NotebookMapping />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={Rocket}
            title="Research Insights & Takeaways"
            subtitle="Findings, limitations and the final conclusion"
          />
          <ResearchInsights />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className={styles.section}>
          <SectionHeading
            icon={FileCode2}
            title="Technical Details"
            subtitle="Stack, environment and reproducibility notes"
          />
          <TechnicalDetails />
        </section>
      </Reveal>
    </div>
  );
}