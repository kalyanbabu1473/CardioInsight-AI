import { Reveal } from "@/components/motion";
import { Aurora } from "@/components/ui";
import styles from "./DashboardPage.module.css";

import DashboardLayout from "./components/DashboardLayout";
import Hero from "./components/Hero";
import ResearchJourney from "./components/ResearchJourney";
import ProjectGlance from "./components/ProjectGlance";
import KpiGrid from "./components/KpiGrid";
import ModelPerformance from "./components/ModelPerformance";
import RecentActivity from "./components/RecentActivity";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Aurora />
      <div className={styles.page}>
        <Hero />

        <Reveal>
          <ResearchJourney />
        </Reveal>

        <Reveal>
          <ProjectGlance />
        </Reveal>

        <Reveal>
          <KpiGrid />
        </Reveal>

        <Reveal>
          <ModelPerformance />
        </Reveal>

        <Reveal>
          <RecentActivity />
        </Reveal>
      </div>
    </DashboardLayout>
  );
}