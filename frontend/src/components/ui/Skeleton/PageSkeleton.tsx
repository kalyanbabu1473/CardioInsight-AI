import { memo, type ReactElement } from "react";

import Skeleton from "./Skeleton";
import SkeletonText from "./SkeletonText";
import SkeletonCircle from "./SkeletonCircle";
import SkeletonButton from "./SkeletonButton";
import SkeletonBars from "./SkeletonBars";
import SkeletonTable from "./SkeletonTable";
import SkeletonFeatureBars from "./SkeletonFeatureBars";

import styles from "./PageSkeleton.module.css";

export type PageVariant =
  | "dashboard"
  | "project"
  | "dataset"
  | "models"
  | "explainability"
  | "assessment"
  | "reports"
  | "settings";

/* ---------- Shared bits ---------- */

function SectionHeading({ badge = false }: { badge?: boolean }) {
  return (
    <div className={styles.sectionHeading}>
      <Skeleton width={44} height={44} radius={12} />
      <div className={styles.sectionCopy}>
        <Skeleton width={240} height={18} radius={6} />
        <Skeleton width={320} height={12} radius={6} />
      </div>
      {badge && (
        <Skeleton
          width={84}
          height={24}
          radius={999}
          className={styles.headingBadge}
        />
      )}
    </div>
  );
}

function GradientHero({ title = 280 }: { title?: number }) {
  return (
    <div className={styles.gradHero}>
      <div className={styles.gradHeroBody}>
        <Skeleton
          width={160}
          height={22}
          radius={999}
          className={styles.heroBadge}
        />
        <Skeleton width={title} height={44} radius={8} />
        <SkeletonText
          lines={2}
          widths={["100%", "70%"]}
          className={styles.heroText}
        />
      </div>
    </div>
  );
}

function StatRow({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.statRow}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.statCard}>
          <SkeletonCircle size={48} className={styles.statIcon} />
          <div className={styles.statMeta}>
            <Skeleton width="70%" height={20} radius={6} />
            <Skeleton width="90%" height={12} radius={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Track({ fill = 50 }: { fill?: number }) {
  return (
    <div className={styles.track}>
      <Skeleton height={10} radius={5} style={{ width: `${fill}%` }} />
    </div>
  );
}

/* ---------- Dashboard ---------- */

function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.dashHero}>
        <div className={styles.dashHeroContent}>
          <Skeleton width={150} height={22} radius={999} className={styles.heroBadge} />
          <Skeleton width="85%" className={styles.dashHeroTitle} radius={10} />
          <SkeletonText
            lines={2}
            widths={["100%", "72%"]}
            className={styles.heroText}
          />
          <div className={styles.dashHeroStats}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.dashHeroStat}>
                <Skeleton width={90} height={26} radius={8} />
                <Skeleton width={70} height={13} radius={6} />
              </div>
            ))}
          </div>
          <div className={styles.dashHeroActions}>
            <SkeletonButton width={168} height={52} radius="8px" />
            <SkeletonButton width={168} height={52} radius="8px" />
          </div>
        </div>
        <div className={styles.dashHeroVisual}>
          <div className={styles.dashHeroRing}>
            <SkeletonCircle size={120} />
          </div>
        </div>
      </div>

      <div className={styles.journeyHeader}>
        <Skeleton width={180} height={20} radius={6} />
        <Skeleton width={120} height={32} radius={8} />
      </div>
      <div className={styles.journeyTrack}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.journeyCard}>
            <div className={styles.journeyCardTop}>
              <Skeleton width={40} height={20} radius={6} />
              <Skeleton width={64} height={22} radius={999} />
            </div>
            <Skeleton width="85%" height={18} radius={6} />
            <SkeletonText lines={2} widths={["100%", "78%"]} />
            <div style={{ marginTop: "auto" }}>
              <Skeleton width={80} height={22} radius={999} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.projSummary}>
        <Skeleton width={160} height={20} radius={6} />
        <SkeletonText lines={2} widths={["100%", "80%"]} />
        <div className={styles.projGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.projItem}>
              <Skeleton width={110} height={13} radius={6} />
              <Skeleton width={140} height={15} radius={6} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.kpiCard}>
            <Skeleton width={48} height={48} radius={8} />
            <Skeleton width={90} height={13} radius={6} />
            <Skeleton width={120} height={30} radius={8} />
            <Skeleton width={70} height={12} radius={6} />
          </div>
        ))}
      </div>

      <div className={styles.mpCard}>
        <div className={styles.mpHeader}>
          <Skeleton width={220} height={20} radius={6} />
          <Skeleton width={140} height={28} radius={999} />
        </div>
        <div className={styles.rocLayout}>
          <div className={styles.rocChart}>
            <SkeletonCircle size={200} />
            <Skeleton width={90} height={12} radius={6} />
          </div>
          <div className={styles.mpBars}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={styles.mpBarRow}>
                <Skeleton width={104} height={13} radius={6} />
                <Track fill={30 + ((i * 9) % 60)} />
                <Skeleton width={56} height={12} radius={6} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.activityCard}>
        <div className={styles.activityHeader}>
          <Skeleton width={160} height={20} radius={6} />
          <Skeleton width={90} height={32} radius={8} />
        </div>
        <div className={styles.activityList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.activityItem}>
              <SkeletonCircle size={44} />
              <div className={styles.activityMeta}>
                <Skeleton width="55%" height={15} radius={6} />
                <Skeleton width="80%" height={12} radius={6} />
              </div>
              <Skeleton width={64} height={22} radius={999} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Project ---------- */

function ProjectSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.projHero}>
        <div className={styles.projLeft}>
          <Skeleton width={200} height={24} radius={999} className={styles.heroBadge} />
          <Skeleton width="90%" className={styles.projTitle} radius={10} />
          <SkeletonText
            lines={3}
            widths={["100%", "95%", "60%"]}
            className={styles.heroText}
          />
          <div className={styles.projButtons}>
            <SkeletonButton width={168} height={52} radius="8px" />
            <SkeletonButton width={168} height={52} radius="8px" />
          </div>
        </div>
        <div className={styles.projRight}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.projCard}>
              <Skeleton width={28} height={28} radius={8} />
              <Skeleton width={110} height={13} radius={6} />
              <Skeleton width={150} height={28} radius={8} />
              <Skeleton width={90} height={12} radius={6} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.overviewSection}>
        <div className={styles.overviewHeading}>
          <Skeleton width={260} height={38} radius={8} />
          <Skeleton width="55%" height={14} radius={6} />
          <Skeleton width="40%" height={14} radius={6} />
        </div>
        <div className={styles.overviewGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.overviewCard}>
              <Skeleton width={58} height={58} radius={16} />
              <Skeleton width={180} height={20} radius={6} />
              <SkeletonText lines={3} widths={["100%", "92%", "70%"]} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.pipelineSection}>
        <div className={styles.pipelineHeading}>
          <Skeleton width={220} height={22} radius={999} />
          <Skeleton width={240} height={36} radius={8} />
          <Skeleton width="45%" height={14} radius={6} />
        </div>
        <div className={styles.pipelineCard}>
          <div className={styles.canvas}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.pipelineRow}>
                <div className={styles.sideCard}>
                  <SkeletonCircle size={56} />
                  <Skeleton width={120} height={16} radius={6} />
                  <div className={styles.sideList}>
                    <Skeleton width="90%" height={10} radius={5} />
                    <Skeleton width="70%" height={10} radius={5} />
                    <Skeleton width="80%" height={10} radius={5} />
                  </div>
                </div>
                <div className={styles.connector}>
                  <div className={styles.connectorLine} />
                </div>
                {i === 2 ? (
                  <div className={styles.modelDevCard}>
                    <div className={styles.modelDevHead}>
                      <Skeleton width={64} height={64} radius={12} />
                      <div>
                        <Skeleton width={90} height={12} radius={6} />
                        <Skeleton width={220} height={20} radius={6} />
                      </div>
                    </div>
                    <div className={styles.modelDevModels}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className={styles.miniModel}>
                          <SkeletonCircle size={44} />
                          <div className={styles.modelMeta}>
                            <Skeleton width={90} height={12} radius={6} />
                            <Skeleton width={50} height={18} radius={999} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.stageCard}>
                    <Skeleton width="100%" height={4} radius={2} />
                    <div className={styles.modelDevHead}>
                      <Skeleton width={48} height={48} radius={6} />
                      <div className={styles.modelMeta}>
                        <Skeleton width={80} height={11} radius={6} />
                        <Skeleton width={160} height={16} radius={6} />
                        <Skeleton width={90} height={18} radius={999} />
                      </div>
                    </div>
                  </div>
                )}
                <div className={styles.connector}>
                  <div className={styles.connectorLine} />
                </div>
                <div className={styles.sideCard}>
                  <SkeletonCircle size={56} />
                  <Skeleton width={120} height={16} radius={6} />
                  <div className={styles.sideList}>
                    <Skeleton width="90%" height={10} radius={5} />
                    <Skeleton width="70%" height={10} radius={5} />
                    <Skeleton width="80%" height={10} radius={5} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dataset ---------- */

function DatasetSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.dsHeader}>
        <div className={styles.dsHeaderContent}>
          <Skeleton width={240} height={36} radius={8} />
          <SkeletonText
            lines={2}
            widths={["90%", "60%"]}
            className={styles.heroText}
          />
        </div>
        <div className={styles.dsAside}>
          <Skeleton width={130} height={26} radius={999} />
          <SkeletonButton width={150} height={44} radius="8px" />
        </div>
      </div>

      <div className={styles.statRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statCard}>
            <SkeletonCircle size={46} className={styles.statIcon} />
            <div className={styles.statMeta}>
              <Skeleton width="60%" height={13} radius={6} />
              <Skeleton width="80%" height={28} radius={8} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dsToolbar}>
        <div className={styles.dsField}>
          <Skeleton width="100%" height={44} radius={999} />
        </div>
        <div className={styles.dsField}>
          <Skeleton width="100%" height={44} radius={999} />
        </div>
        <div className={styles.dsField}>
          <Skeleton width="100%" height={44} radius={999} />
        </div>
      </div>

      <SkeletonTable rows={10} cols={4} />
    </div>
  );
}

/* ---------- Models ---------- */

function ModelCardSkeleton() {
  return (
    <div className={styles.modelCard}>
      <div className={styles.modelCardHead}>
        <SkeletonCircle size={44} />
        <div className={styles.modelMeta}>
          <Skeleton width={160} height={20} radius={6} />
          <Skeleton width={100} height={12} radius={6} />
        </div>
      </div>
      <SkeletonText lines={2} widths={["100%", "85%"]} />
      <div className={styles.modelChips}>
        <Skeleton width={80} height={24} radius={999} />
        <Skeleton width={110} height={24} radius={999} />
      </div>
      <div className={styles.modelBars}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={styles.modelBarRow}>
            <Skeleton width={96} height={12} radius={6} />
            <Track fill={30 + ((i * 9) % 60)} />
            <Skeleton width={44} height={12} radius={6} />
          </div>
        ))}
      </div>
      <div className={styles.modelTwoCol}>
        {[0, 1].map((col) => (
          <div key={col} className={styles.listBlock}>
            <Skeleton width={110} height={14} radius={6} />
            <Skeleton width="95%" height={11} radius={5} />
            <Skeleton width="85%" height={11} radius={5} />
            <Skeleton width="75%" height={11} radius={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelsSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.gradHero}>
        <div className={styles.gradHeroBody}>
          <Skeleton width={150} height={22} radius={999} className={styles.heroBadge} />
          <Skeleton width={220} height={44} radius={8} />
          <SkeletonText
            lines={3}
            widths={["100%", "90%", "65%"]}
            className={styles.heroText}
          />
        </div>
      </div>

      <StatRow count={6} />

      <div className={styles.section}>
        <SectionHeading badge />
        <div className={styles.modelGrid}>
          <ModelCardSkeleton />
          <ModelCardSkeleton />
          <ModelCardSkeleton />
          <ModelCardSkeleton />
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading badge />
        <div className={styles.tableToolbar}>
          <div className={styles.tableSearch}>
            <SkeletonCircle size={16} />
            <Skeleton width={160} height={12} radius={6} />
          </div>
          <Skeleton width={140} height={12} radius={6} />
        </div>
        <div className={styles.tableWrap}>
          <div className={styles.table}>
            <div className={styles.thead}>
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} height={12} radius={6} width="80%" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, r) => (
              <div key={r} className={styles.tr}>
                {Array.from({ length: 9 }).map((_, c) => (
                  <Skeleton
                    key={c}
                    height={12}
                    radius={6}
                    width={c === 0 ? "60%" : c === 8 ? "90%" : "100%"}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading />
        <div className={styles.accordionList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.accordionCard}>
              <div className={styles.accordionToggle}>
                <div className={styles.modelCardHead}>
                  <SkeletonCircle size={40} />
                  <div className={styles.modelMeta}>
                    <Skeleton width={160} height={16} radius={6} />
                    <Skeleton width={110} height={11} radius={6} />
                  </div>
                </div>
                <SkeletonCircle size={18} />
              </div>
              {i === 0 && (
                <div className={styles.accordionBody}>
                  <SkeletonText lines={2} widths={["100%", "90%"]} />
                  <div className={styles.accordionGrid}>
                    {[0, 1].map((col) => (
                      <div key={col} className={styles.listBlock}>
                        <Skeleton width={130} height={13} radius={6} />
                        <Skeleton width="90%" height={11} radius={5} />
                        <Skeleton width="80%" height={11} radius={5} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading badge />
        <div className={styles.pipelineWrap}>
          <div className={styles.pipelineRail}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.pipelineCluster}>
                <div className={styles.pipelineStep}>
                  <SkeletonCircle size={72} className={styles.pipelineNode} />
                  <Skeleton width={100} height={13} radius={6} />
                  <Skeleton width={72} height={10} radius={5} />
                </div>
                {i < 9 && (
                  <Skeleton
                    width={20}
                    height={20}
                    radius={999}
                    className={styles.pipelineArrow}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading badge />
        <div className={styles.masonry}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.usagePanel}>
              <Skeleton width={200} height={18} radius={6} />
              {i === 3 ? (
                <div className={styles.consensusGrid}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <div key={j} className={styles.consensusItem}>
                      <Skeleton width={70} height={12} radius={6} />
                      <Skeleton width={28} height={16} radius={6} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.usageBars}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className={styles.usageRow}>
                      <Skeleton width={120} height={12} radius={6} />
                      <Track fill={20 + ((j * 9) % 65)} />
                      <Skeleton width={60} height={12} radius={6} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading badge />
        <div className={styles.evalStack}>
          <div className={styles.evalGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.evalCard}>
                <Skeleton width={140} height={18} radius={6} />
                <div className={styles.tileGrid}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <Skeleton key={j} height={44} radius={8} width="100%" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.cmPanel}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.cmBox}>
                <Skeleton width={90} height={12} radius={6} />
                <div className={styles.cmCells}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} height={40} radius={8} width="100%" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.figureGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.evalCard}>
                <Skeleton width="100%" height={180} radius={8} />
                <Skeleton width={140} height={12} radius={6} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading badge />
        <div className={styles.bestModel}>
          <div className={styles.bestHead}>
            <SkeletonCircle size={52} />
            <div className={styles.modelMeta}>
              <Skeleton width={120} height={12} radius={6} />
              <Skeleton width={220} height={28} radius={8} />
            </div>
          </div>
          <div className={styles.bestBody}>
            <div className={styles.bestInner}>
              <Skeleton width={140} height={16} radius={6} />
              <SkeletonText lines={4} widths={["100%", "92%", "88%", "70%"]} />
            </div>
            <div className={styles.bestInner}>
              <Skeleton width={140} height={16} radius={6} />
              <div className={styles.tileGrid}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <Skeleton key={j} height={44} radius={8} width="100%" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading badge />
        <div className={styles.notebookList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.notebookItem}>
              <div className={styles.notebookTrack}>
                <div className={styles.notebookDot}>
                  <SkeletonCircle size={14} />
                </div>
                {i < 4 && <Skeleton width={2} height={60} radius={1} />}
              </div>
              <div className={styles.notebookCard}>
                <Skeleton width={120} height={12} radius={6} />
                <Skeleton width={240} height={18} radius={6} />
                <Skeleton width="80%" height={11} radius={5} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading />
        <div className={styles.insightsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.insightCard}>
              <SkeletonCircle size={40} />
              <Skeleton width={160} height={18} radius={6} />
              <SkeletonText lines={2} widths={["100%", "80%"]} />
            </div>
          ))}
        </div>
        <div className={styles.conclusion}>
          <Skeleton width={200} height={18} radius={6} />
          <SkeletonText lines={2} widths={["100%", "85%"]} />
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeading />
        <div className={styles.techBlocks}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={styles.techBlock}>
              <div className={styles.techBlockHead}>
                <SkeletonCircle size={36} />
                <Skeleton width={200} height={18} radius={6} />
              </div>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className={styles.techRow}>
                  <Skeleton width={180} height={13} radius={6} />
                  <Skeleton width="80%" height={13} radius={6} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Explainability ---------- */

function ExplainabilitySkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.gradHero}>
        <div className={styles.gradHeroBody}>
          <Skeleton width={150} height={22} radius={999} className={styles.heroBadge} />
          <Skeleton width={300} height={44} radius={8} />
          <SkeletonText
            lines={2}
            widths={["100%", "78%"]}
            className={styles.heroText}
          />
        </div>
      </div>

      <StatRow count={3} />

      <div className={styles.section}>
        <div className={styles.panel}>
          <div className={styles.sectionHead}>
            <SkeletonCircle size={42} />
            <div className={styles.panelHeading}>
              <Skeleton width={200} height={18} radius={6} />
              <Skeleton width={260} height={12} radius={6} />
            </div>
            <Skeleton width={70} height={24} radius={999} className={styles.headingBadge} />
          </div>
          <SkeletonFeatureBars rows={10} />
        </div>
        <div className={styles.panel}>
          <div className={styles.sectionHead}>
            <SkeletonCircle size={42} />
            <div className={styles.panelHeading}>
              <Skeleton width={160} height={18} radius={6} />
              <Skeleton width={240} height={12} radius={6} />
            </div>
            <Skeleton width={70} height={24} radius={999} className={styles.headingBadge} />
          </div>
          <div className={styles.shapChart}>
            <SkeletonBars bars={9} maxHeight={160} minHeight={40} />
          </div>
          <div className={styles.shapLegend}>
            {[0, 1].map((i) => (
              <div key={i} className={styles.legendItem}>
                <Skeleton width={12} height={12} radius={4} />
                <Skeleton width={110} height={12} radius={6} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.panel}>
          <div className={styles.sectionHead}>
            <SkeletonCircle size={42} />
            <div className={styles.panelHeading}>
              <Skeleton width={160} height={18} radius={6} />
              <Skeleton width={250} height={12} radius={6} />
            </div>
            <Skeleton width={70} height={24} radius={999} className={styles.headingBadge} />
          </div>
          <div className={styles.riskBanner}>
            {[0, 1].map((i) => (
              <div key={i} className={styles.riskBlock}>
                <Skeleton width={90} height={20} radius={6} />
                <Skeleton width={70} height={12} radius={6} />
              </div>
            ))}
            <Skeleton width={20} height={20} radius={6} />
          </div>
          <div className={styles.localList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.localItem}>
                <div>
                  <Skeleton width={120} height={13} radius={6} />
                  <Skeleton width={70} height={11} radius={5} />
                </div>
                <Skeleton width={80} height={13} radius={6} />
                <div className={styles.localBar}>
                  <Skeleton height={6} radius={3} style={{ width: `${35 + ((i * 11) % 55)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.sectionHead}>
            <SkeletonCircle size={42} />
            <div className={styles.panelHeading}>
              <Skeleton width={180} height={18} radius={6} />
              <Skeleton width={240} height={12} radius={6} />
            </div>
            <Skeleton width={90} height={24} radius={999} className={styles.headingBadge} />
          </div>
          <div className={styles.cmpTable}>
            <div className={styles.cmpHead}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={12} radius={6} width="80%" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, r) => (
              <div key={r} className={styles.cmpRow}>
                {Array.from({ length: 6 }).map((_, c) =>
                  c === 0 ? (
                    <Skeleton key={c} height={12} radius={6} width="70%" />
                  ) : (
                    <div key={c} className={styles.cmpTrack}>
                      <Skeleton height={6} radius={3} style={{ width: `${40 + ((r * 12 + c * 7) % 55)}%` }} />
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.sectionHead}>
          <SkeletonCircle size={42} />
          <div className={styles.panelHeading}>
            <Skeleton width={200} height={18} radius={6} />
            <Skeleton width={280} height={12} radius={6} />
          </div>
        </div>
        <div className={styles.methodGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.methodCard}>
              <SkeletonCircle size={46} />
              <Skeleton width={150} height={20} radius={6} />
              <SkeletonText lines={3} widths={["100%", "90%", "60%"]} />
              <Skeleton width={90} height={22} radius={999} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Assessment ---------- */

function AssessmentSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.gradHero}>
        <div className={styles.gradHeroBody}>
          <Skeleton width={200} height={24} radius={999} className={styles.heroBadge} />
          <Skeleton width={320} height={44} radius={8} />
          <SkeletonText
            lines={2}
            widths={["100%", "72%"]}
            className={styles.heroText}
          />
        </div>
      </div>

      <div className={styles.wizardGrid}>
        <div className={styles.left}>
          <div className={styles.stepper}>
            <div className={styles.stepperMeta}>
              <Skeleton width={140} height={13} radius={6} />
              <Skeleton width={110} height={18} radius={6} />
            </div>
            <div className={styles.stepperTrack}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={styles.stepperCluster}>
                  <div className={styles.stepperItem}>
                    <SkeletonCircle size={34} />
                    <div className={styles.stepperLabel}>
                      <Skeleton width={76} height={11} radius={5} />
                    </div>
                  </div>
                  {i < 6 && <div className={styles.connector} />}
                </div>
              ))}
            </div>
            <div className={styles.progress}>
              <div className={styles.progressFill} />
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formCardHead}>
              <SkeletonCircle size={42} />
              <div className={styles.formHeadCopy}>
                <Skeleton width={200} height={20} radius={6} />
                <Skeleton width={260} height={13} radius={6} />
              </div>
              <Skeleton width={90} height={22} radius={999} />
            </div>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <Skeleton width={120} height={13} radius={6} />
                <Skeleton width="100%" height={44} radius={8} />
              </div>
              <div className={styles.field}>
                <Skeleton width={120} height={13} radius={6} />
                <Skeleton width="100%" height={44} radius={8} />
              </div>
              <div className={styles.fieldFull}>
                <Skeleton width={120} height={13} radius={6} />
                <Skeleton width="100%" height={44} radius={8} />
              </div>
              <div className={styles.field}>
                <Skeleton width={120} height={13} radius={6} />
                <Skeleton width="100%" height={44} radius={8} />
              </div>
              <div className={styles.field}>
                <Skeleton width={120} height={13} radius={6} />
                <Skeleton width="100%" height={44} radius={8} />
              </div>
            </div>
            <div className={styles.formActions}>
              <SkeletonButton width={130} height={48} radius="8px" />
              <Skeleton width={110} height={14} radius={6} />
              <SkeletonButton width={150} height={48} radius="8px" />
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <Skeleton width={140} height={18} radius={6} />
              <Skeleton width={100} height={12} radius={6} />
            </div>
            <Skeleton width={60} height={24} radius={999} />
          </div>
          <div className={styles.completion}>
            <SkeletonCircle size={84} />
            <div className={styles.completionMeta}>
              <Skeleton width={130} height={14} radius={6} />
              <Skeleton width={110} height={12} radius={6} />
            </div>
          </div>
          <div className={styles.statusRow}>
            <Skeleton width={100} height={13} radius={6} />
            <Skeleton width={90} height={24} radius={999} />
          </div>
          <Skeleton width="100%" height={1} />
          <div className={styles.summaryGroup}>
            <Skeleton width={110} height={13} radius={6} />
            <div className={styles.summaryItem}>
              <SkeletonCircle size={28} />
              <Skeleton width={150} height={14} radius={6} />
            </div>
          </div>
          <div className={styles.summaryGroup}>
            <Skeleton width={140} height={13} radius={6} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.summaryItem}>
                <SkeletonCircle size={22} className={styles.summaryIcon} />
                <Skeleton width={140} height={13} radius={6} />
              </div>
            ))}
          </div>
          <div className={styles.modelCard}>
            <SkeletonCircle size={34} />
            <div className={styles.modelMeta}>
              <Skeleton width={120} height={13} radius={6} />
              <Skeleton width={90} height={12} radius={6} />
            </div>
            <SkeletonCircle size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reports ---------- */

function ReportsSkeleton() {
  return (
    <div className={styles.page}>
      <GradientHero title={280} />

      <div className={styles.reportsGrid}>
        <div className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <SkeletonCircle size={34} />
            <div className={styles.historyHeaderCopy}>
              <Skeleton width={140} height={16} radius={6} />
              <Skeleton width={100} height={12} radius={6} />
            </div>
          </div>
          <div className={styles.historyList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.historyItem}>
                <Skeleton width={46} height={46} radius={6} className={styles.historyRisk} />
                <div className={styles.historyBody}>
                  <Skeleton width={90} height={13} radius={6} />
                  <Skeleton width={150} height={12} radius={6} />
                  <Skeleton width={80} height={12} radius={6} />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.printFooter}>
            <SkeletonButton width="100%" height={48} radius="8px" />
          </div>
        </div>

        <div className={styles.rvStack}>
          <div className={styles.rvHead}>
            <div className={styles.rvHeadCopy}>
              <Skeleton width={180} height={22} radius={999} className={styles.heroBadge} />
              <Skeleton width={240} height={30} radius={8} />
              <div className={styles.rvHeadMeta}>
                <Skeleton width={140} height={12} radius={6} />
                <Skeleton width={120} height={12} radius={6} />
              </div>
            </div>
          </div>

          <div className={styles.rvSection}>
            <div className={styles.sectionHead}>
              <SkeletonCircle size={36} />
              <Skeleton width={150} height={18} radius={6} />
            </div>
            <div className={styles.summaryGrid}>
              <div className={styles.gaugeBlock}>
                <SkeletonCircle size={220} />
              </div>
              <div className={styles.statsGrid}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.statCell}>
                    <Skeleton width={60} height={12} radius={6} />
                    <Skeleton width={90} height={22} radius={6} />
                    <Skeleton width={100} height={11} radius={5} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.rvSection}>
            <div className={styles.sectionHead}>
              <SkeletonCircle size={36} />
              <Skeleton width={160} height={18} radius={6} />
            </div>
            <div className={styles.patientGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.patientCell}>
                  <Skeleton width={70} height={11} radius={5} />
                  <Skeleton width={90} height={15} radius={6} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rvSection}>
            <div className={styles.sectionHead}>
              <SkeletonCircle size={36} />
              <Skeleton width={190} height={18} radius={6} />
            </div>
            <div className={styles.factorList}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.factorRow}>
                  <div>
                    <Skeleton width={150} height={13} radius={6} />
                    <div className={styles.factorTrack} style={{ marginTop: 8 }}>
                      <Skeleton height={8} radius={4} style={{ width: `${35 + ((i * 12) % 55)}%` }} />
                    </div>
                  </div>
                  <Skeleton width={48} height={13} radius={6} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rvSection}>
            <div className={styles.sectionHead}>
              <SkeletonCircle size={36} />
              <Skeleton width={180} height={18} radius={6} />
            </div>
            <SkeletonText lines={2} widths={["100%", "85%"]} />
            <div className={styles.methodChips}>
              <Skeleton width={90} height={26} radius={999} />
              <Skeleton width={70} height={26} radius={999} />
              <Skeleton width={110} height={26} radius={999} />
            </div>
          </div>

          <div className={styles.rvSection}>
            <div className={styles.sectionHead}>
              <SkeletonCircle size={36} />
              <Skeleton width={140} height={18} radius={6} />
            </div>
            <div className={styles.chartBlock}>
              <SkeletonBars bars={9} maxHeight={160} minHeight={40} />
            </div>
            <div className={styles.shapLegend}>
              {[0, 1].map((i) => (
                <div key={i} className={styles.legendItem}>
                  <Skeleton width={12} height={12} radius={4} />
                  <Skeleton width={110} height={12} radius={6} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rvSection}>
            <div className={styles.sectionHead}>
              <SkeletonCircle size={36} />
              <Skeleton width={180} height={18} radius={6} />
            </div>
            <div className={styles.chartBlock}>
              <SkeletonBars bars={12} maxHeight={160} minHeight={40} />
            </div>
          </div>

          <div className={styles.rvSection}>
            <div className={styles.sectionHead}>
              <SkeletonCircle size={36} />
              <Skeleton width={160} height={18} radius={6} />
            </div>
            <div className={styles.recGrid}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.recCard}>
                  <div className={styles.recHead}>
                    <SkeletonCircle size={38} />
                    <div>
                      <Skeleton width={130} height={18} radius={6} />
                      <Skeleton width={90} height={11} radius={5} />
                    </div>
                  </div>
                  <div className={styles.recList}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className={styles.recItem}>
                        <SkeletonCircle size={18} />
                        <Skeleton width="80%" height={12} radius={6} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rvFooter}>
            <Skeleton width={140} height={14} radius={6} />
            <Skeleton width={220} height={12} radius={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsSkeleton() {
  return (
    <div className={styles.page}>
      <GradientHero title={240} />

      <div className={styles.settingsPanel}>
        <div className={styles.settingsPanelHead}>
          <SkeletonCircle size={40} />
          <div className={styles.settingsPanelCopy}>
            <Skeleton width={120} height={16} radius={6} />
            <Skeleton width={220} height={12} radius={6} />
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={styles.settingRow}>
            <div className={styles.rowText}>
              <Skeleton width={180} height={15} radius={6} />
              <Skeleton width={260} height={12} radius={6} />
            </div>
            <div className={styles.switch}>
              <Skeleton width={22} height={22} radius={999} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Registry ---------- */

const skeletonMap: Record<PageVariant, () => ReactElement> = {
  dashboard: DashboardSkeleton,
  project: ProjectSkeleton,
  dataset: DatasetSkeleton,
  models: ModelsSkeleton,
  explainability: ExplainabilitySkeleton,
  assessment: AssessmentSkeleton,
  reports: ReportsSkeleton,
  settings: SettingsSkeleton,
};

export interface PageSkeletonProps {
  variant: PageVariant;
}

function PageSkeleton({ variant }: PageSkeletonProps) {
  const Comp = skeletonMap[variant] ?? DashboardSkeleton;
  return <Comp />;
}

export default memo(PageSkeleton);
