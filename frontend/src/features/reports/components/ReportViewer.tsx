import { motion } from "framer-motion";
import clsx from "clsx";
import {
  Activity,
  Apple,
  BarChart3,
  CalendarClock,
  ClipboardList,
  Cpu,
  FlaskConical,
  HeartPulse,
  Pill,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui";
import {
  AI_HEALTH_DISCLAIMER_FULL,
  AI_HEALTH_DISCLAIMER_SHORT,
  AiHealthDisclaimer,
} from "@/components/ui";

import type { AssessmentResult } from "@/features/assessment/assessmentResult";
import {
  PREDICTION_MODEL,
  type Contribution,
  type RiskLevel,
} from "@/features/assessment/assessmentService";
import { featureImportance } from "../featureImportance.generated";

import RiskGauge from "./RiskGauge";
import RecommendationCard, {
  type RecommendationVariant,
} from "./RecommendationCard";
import {
  formatDateTime,
  formatPercent,
  patientInfo,
} from "../reportService";

import styles from "./ReportViewer.module.css";

const LEVEL_COLORS: Record<RiskLevel, string> = {
  Low: "var(--color-success)",
  Moderate: "var(--color-warning)",
  High: "var(--color-danger)",
};

const LEVEL_VARIANT: Record<RiskLevel, "success" | "warning" | "danger"> = {
  Low: "success",
  Moderate: "warning",
  High: "danger",
};

interface ReportSectionProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function ReportSection({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: ReportSectionProps) {
  return (
    <motion.section
      className={clsx(styles.section, className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>
          <Icon size={16} />
        </span>
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {children}
    </motion.section>
  );
}

function FactorBar({
  factor,
  max,
  index,
}: {
  factor: Contribution;
  max: number;
  index: number;
}) {
  const width = max > 0 ? (Math.abs(factor.contribution) / max) * 100 : 0;
  const positive = factor.contribution >= 0;

  return (
    <div className={styles.factor}>
      <div className={styles.factorRow}>
        <span className={styles.factorName}>{factor.name}</span>
        <span className={styles.factorValue}>{factor.value}</span>
      </div>
      <div className={styles.factorTrack}>
        <motion.div
          className={clsx(
            styles.factorBar,
            positive ? styles.barRisk : styles.barProtective,
          )}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{
            duration: 0.8,
            delay: 0.1 + index * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </div>
    </div>
  );
}

export default function ReportViewer({
  assessment,
  disclaimer = "full",
}: {
  assessment: AssessmentResult;
  /** "full" on screen; "short" for the printable/pdf variant. */
  disclaimer?: "full" | "short";
}) {
  const { result } = assessment;
  const color = LEVEL_COLORS[result.level];
  const maxContribution = Math.max(
    1,
    ...result.topFactors.map((f) => Math.abs(f.contribution)),
  );

  const shapData = result.topFactors.map((f) => ({
    name: f.name,
    value: Math.round(f.contribution * 1000) / 1000,
  }));

  const importanceData = featureImportance.slice(0, 8).map((f) => ({
    name: f.name.split(" — ")[0],
    value: f.importance,
  }));

  const recommendationCards: {
    title: string;
    subtitle: string;
    icon: typeof Apple;
    variant: RecommendationVariant;
    items: string[];
  }[] = [
    {
      title: "Clinical Recommendations",
      subtitle: "Therapy & referrals",
      icon: Pill,
      variant: "medical",
      items: result.recommendations.medical,
    },
    {
      title: "Lifestyle Recommendations",
      subtitle: "Daily habits & behavior",
      icon: Apple,
      variant: "lifestyle",
      items: result.recommendations.lifestyle,
    },
    {
      title: "Monitoring Recommendations",
      subtitle: "Follow-up & testing",
      icon: Activity,
      variant: "monitoring",
      items: result.recommendations.monitoring,
    },
  ];

  return (
    <div className={styles.root}>
      <motion.header
        className={styles.head}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.headBody}>
          <div className={styles.eyebrow}>
            <Badge variant="primary">
              <Cpu size={13} />
              {assessment.model} · {assessment.modelTagline}
            </Badge>
            {assessment.legacy && (
              <Badge variant="neutral">Legacy 20-feature record</Badge>
            )}
          </div>
          <h1>Cardiovascular Risk Assessment Report</h1>
          <div className={styles.meta}>
            <span>
              <CalendarClock size={14} />
              {formatDateTime(assessment.createdAt)}
            </span>
            <span>
              <ClipboardList size={14} />
              {assessment.id}
            </span>
          </div>
        </div>
      </motion.header>

      <ReportSection icon={ShieldCheck} title="Risk Summary" subtitle="Model inference">
        <div className={styles.summaryGrid}>
          <div className={styles.gaugeBlock}>
            <RiskGauge value={result.probability} color={color} />
          </div>
          <div className={styles.statsBlock}>
            <div className={styles.statRow}>
              <Badge variant={LEVEL_VARIANT[result.level]}>
                <ShieldCheck size={13} />
                {result.level} Risk
              </Badge>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <span className={styles.statIcon}>
                  <TrendingUp size={16} />
                </span>
                <span className={styles.statValue} style={{ color }}>
                  {formatPercent(result.probability)}
                </span>
                <span className={styles.statLabel}>Risk Probability</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statIcon}>
                  <FlaskConical size={16} />
                </span>
                <span className={styles.statValue}>
                  {formatPercent(result.confidence, 0)}
                </span>
                <span className={styles.statLabel}>Confidence Score</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statIcon}>
                  <BarChart3 size={16} />
                </span>
                <span className={styles.statValue}>{result.level}</span>
                <span className={styles.statLabel}>Risk Classification</span>
              </div>
            </div>
            <p className={styles.interpretation}>{result.interpretation}</p>
          </div>
        </div>
      </ReportSection>

      <ReportSection icon={User} title="Patient Information" subtitle="Assessment inputs">
        <div className={styles.patientGrid}>
          {patientInfo(assessment).map((row) => (
            <div key={row.label} className={styles.patientCell}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection
        icon={HeartPulse}
        title="Top Contributing Factors"
        subtitle="Highest-impact variables for this assessment"
      >
        <div className={styles.factorList}>
          {result.topFactors.map((factor, index) => (
            <FactorBar
              key={factor.name}
              factor={factor}
              max={maxContribution}
              index={index}
            />
          ))}
        </div>
      </ReportSection>

      <ReportSection
        icon={Wand2}
        title="Explainable AI Summary"
        subtitle="How this prediction was made"
      >
        <p className={styles.xaiText}>
          The Random Forest ensemble assigned this patient a{" "}
          <strong>{result.level.toLocaleLowerCase()}</strong> predicted
          cardiovascular risk of {formatPercent(result.probability)} with a
          confidence score of {formatPercent(result.confidence, 0)}. The model
          attribution below reflects how strongly each feature shifted the
          prediction away from baseline, using SHAP (Shapley) explanations to
          provide a transparent, per-patient rationale.
        </p>
        <div className={styles.methodChips}>
          <span className={styles.chip}>SHAP · Local</span>
          <span className={styles.chip}>SHAP · Global</span>
          <span className={styles.chip}>Gini Importance · Global</span>
          <span className={styles.chip}>LIME</span>
        </div>
      </ReportSection>

      <ReportSection
        icon={Sparkles}
        title="SHAP Summary"
        subtitle="Feature contributions for this assessment"
      >
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={shapData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-alt)" }}
                formatter={(value) => [
                  `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(3)}`,
                  "contribution",
                ]}
              />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={14}>
                {shapData.map((row) => (
                  <Cell
                    key={row.name}
                    fill={row.value >= 0 ? "var(--color-purple)" : "var(--color-ai)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.swatchPositive} /> Increases risk
          </span>
          <span className={styles.legendItem}>
            <span className={styles.swatchNegative} /> Decreases risk
          </span>
        </div>
      </ReportSection>

      <ReportSection
        icon={BarChart3}
        title="Feature Importance"
        subtitle="Global model importance (Random Forest)"
      >
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={importanceData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={116}
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-alt)" }}
                formatter={(value) => [
                  `${(Number(value) * 100).toFixed(1)}%`,
                  "relative importance",
                ]}
              />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 4, 4]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportSection>

      <ReportSection
        icon={ClipboardList}
        title="Recommendations"
        subtitle="Personalized guidance for this assessment"
      >
        <div className={styles.cardGrid}>
          {recommendationCards.map((card) => (
            <RecommendationCard
              key={card.title}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              variant={card.variant}
              items={card.items}
            />
          ))}
        </div>
      </ReportSection>

      <AiHealthDisclaimer
        text={
          disclaimer === "short"
            ? AI_HEALTH_DISCLAIMER_SHORT
            : AI_HEALTH_DISCLAIMER_FULL
        }
      />

      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span className={styles.footerBrand}>
          <Cpu size={15} />
          {PREDICTION_MODEL.name} — CardioInsight AI Platform v1.0.0
        </span>
        <p>
          Generated at {formatDateTime(assessment.createdAt)} · Assessment{" "}
          {assessment.id}. For research and demonstration purposes only — not a
          substitute for professional medical advice.
        </p>
      </motion.footer>
    </div>
  );
}
