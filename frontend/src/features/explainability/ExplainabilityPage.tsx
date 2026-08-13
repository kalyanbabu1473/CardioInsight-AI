import {
  BarChart3,
  Layers,
  ScanSearch,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import Panel from "./components/Panel";
import FeatureImportance from "./components/FeatureImportance";
import ShapSummary from "./components/ShapSummary";
import LocalExplanation from "./components/LocalExplanation";
import ModelComparison from "./components/ModelComparison";
import MethodCards from "./components/MethodCards";

import { projectInfo } from "@/data/dashboard/project";

import styles from "./ExplainabilityPage.module.css";

const stats = [
  { icon: Target, value: projectInfo.selectedFeatures.toString(), label: "Features Explained" },
  { icon: Layers, value: "3", label: "Interpretability Methods" },
  { icon: Sparkles, value: "0.91", label: "Best ROC-AUC" },
];

export default function ExplainabilityPage() {
  return (
    <div className={styles.page}>
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.content}>
          <span className={styles.badge}>Explainable AI</span>
          <h1 className={styles.title}>Model Explainability</h1>
          <p className={styles.description}>
            Transparent, interpretable insights into how the CardioInsight AI
            model predicts cardiovascular disease risk &mdash; using SHAP, LIME
            and global feature attribution across the trained ensemble.
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
        <div className={styles.row}>
          <Panel
            icon={BarChart3}
            title="Global Feature Importance"
            subtitle="Permutation importance over the final selected features"
            badge="Global"
          >
            <FeatureImportance />
          </Panel>

          <Panel
            icon={Sparkles}
            title="SHAP Summary"
            subtitle="Mean absolute Shapley values per feature"
            badge="SHAP"
          >
            <ShapSummary />
          </Panel>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className={styles.row}>
          <Panel
            icon={ScanSearch}
            title="Local Explanation"
            subtitle="Single prediction breakdown for an example patient"
            badge="Local"
          >
            <LocalExplanation />
          </Panel>

          <Panel
            icon={Scale}
            title="Model Comparison"
            subtitle="Benchmark metrics across trained algorithms"
            badge="Best: XGBoost"
          >
            <ModelComparison />
          </Panel>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Panel
          icon={Layers}
          title="Interpretability Methods"
          subtitle="The explainability techniques applied to the final model"
        >
          <MethodCards />
        </Panel>
      </Reveal>
    </div>
  );
}