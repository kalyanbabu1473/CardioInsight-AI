/**
 * Report service — pure helpers for rendering and exporting clinical reports
 * built from an AssessmentResult.
 *
 * Input rendering is contract-driven: the 44 features come straight from the
 * feature contract (labels, units, derived BMI), so a report always reflects
 * exactly what the model consumed. Records created by the older 20-feature
 * build are detected (`legacy`) and rendered from their flat input instead.
 */

import type { AssessmentResult } from "@/features/assessment/assessmentResult";
import {
  FEATURE_ORDER,
  getFeature,
} from "@/data/assessment/featureContract";
import {
  PREDICTION_MODEL,
  bmiCategory,
  calculateBmi,
  formatFeatureValue,
  type AssessmentInput,
  type RiskResult,
} from "@/features/assessment/assessmentService";

/* ------------------------------------------------------------------ */
/*  Formatters                                                          */
/* ------------------------------------------------------------------ */

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/* ------------------------------------------------------------------ */
/*  Input value helpers                                                */
/* ------------------------------------------------------------------ */

export function isLegacyAssessment(assessment: AssessmentResult): boolean {
  return assessment.legacy === true;
}

/** Ordered clinical rows for a current (44-feature) assessment input. */
function currentFeatureRows(input: AssessmentInput): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  for (const name of FEATURE_ORDER) {
    const spec = getFeature(name);
    if (spec.derived) continue;
    const [section, key] = spec.field.split(".");
    const s = (
      input[section as keyof AssessmentInput] as unknown as Record<string, unknown>
    );
    const raw = s?.[key];
    if (raw === undefined || raw === null) continue;
    rows.push({
      label: spec.label,
      value: formatFeatureValue(spec, raw as string | number),
    });
  }
  return rows;
}

/** Ordered clinical rows for a legacy (flat 20-feature) assessment input. */
function legacyFeatureRows(input: Record<string, unknown>): { label: string; value: string }[] {
  return Object.entries(input ?? {}).map(([key, value]) => ({
    label: key,
    value:
      value && typeof value === "object"
        ? JSON.stringify(value)
        : String(value),
  }));
}

export function inputRows(input: AssessmentInput | Record<string, unknown>): {
  label: string;
  value: string;
}[] {
  if (input && typeof input === "object" && "bodyComposition" in input) {
    return currentFeatureRows(input as AssessmentInput);
  }
  return legacyFeatureRows(input as Record<string, unknown>);
}

/* ------------------------------------------------------------------ */
/*  Patient info (summary cells + BMI)                                  */
/* ------------------------------------------------------------------ */

export function patientInfo(assessment: AssessmentResult) {
  if (isLegacyAssessment(assessment)) {
    const legacyInput = assessment.input as unknown as Record<string, unknown>;
    const count = Object.keys(legacyInput ?? {}).length;
    return [
      { label: "Format", value: "Legacy 20-feature assessment" },
      { label: "Recorded inputs", value: `${count} recorded fields` },
      { label: "Note", value: "Rendered from the earlier build's flat input." },
    ];
  }

  const input = assessment.input;
  const bmi = calculateBmi(input.bodyComposition.heightCm, input.bodyComposition.weightKg);
  return [
    { label: "Age", value: `${input.demographics.age} years` },
    { label: "Height", value: `${input.bodyComposition.heightCm} cm` },
    { label: "Weight", value: `${input.bodyComposition.weightKg} kg` },
    {
      label: "BMI",
      value: bmi > 0 ? `${bmi.toFixed(1)} kg/m² (${bmiCategory(bmi)})` : "—",
    },
    {
      label: "Waist",
      value: `${(input.bodyComposition.waistCm / 2.54).toFixed(1)} in`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Plain-text report                                                   */
/* ------------------------------------------------------------------ */

export function buildReportText(assessment: AssessmentResult): string {
  const { result } = assessment;
  const lines = [
    "CARDIOINSIGHT AI — CARDIOVASCULAR RISK ASSESSMENT REPORT",
    "=========================================================",
    `Assessment ID: ${assessment.id}`,
    `Date & Time: ${formatDateTime(assessment.createdAt)}`,
    `Model: ${assessment.model} (${assessment.modelTagline})`,
    "",
    "Patient Information",
    ...patientInfo(assessment).map((r) => `  ${r.label}: ${r.value}`),
    "",
    "Clinical Inputs",
    ...inputRows(assessment.input).map((r) => `  ${r.label}: ${r.value}`),
    "",
    "Risk Summary",
    `  Risk Probability: ${formatPercent(result.probability)}`,
    `  Risk Classification: ${result.level}`,
    `  Confidence Score: ${formatPercent(result.confidence, 0)}`,
    "",
    "Clinical Interpretation",
    `  ${result.interpretation}`,
    "",
    "Top Contributing Factors",
    ...result.topFactors.map(
      (f) => `  - ${f.name}: ${f.value} (SHAP ${f.contribution >= 0 ? "+" : ""}${(f.contribution * 100).toFixed(1)}%)`,
    ),
    "",
    "Recommendations — Lifestyle",
    ...result.recommendations.lifestyle.map((r) => `  - ${r}`),
    "",
    "Recommendations — Monitoring",
    ...result.recommendations.monitoring.map((r) => `  - ${r}`),
    "",
    "Recommendations — Clinical",
    ...result.recommendations.medical.map((r) => `  - ${r}`),
    "",
    `Generated by ${PREDICTION_MODEL.name} — CardioInsight AI Platform v1.0.0`,
  ];
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  HTML report (print-friendly)                                        */
/* ------------------------------------------------------------------ */

export function buildReportHtml(assessment: AssessmentResult): string {
  const { result, model } = assessment;

  const htmlInputRows = inputRows(assessment.input)
    .map((r) => `<tr><th>${r.label}</th><td>${r.value}</td></tr>`)
    .join("");

  const list = (items: string[]) =>
    items.map((item) => `<li>${item}</li>`).join("");

  const factorRows = result.topFactors
    .map(
      (f) =>
        `<tr><td>${f.name}</td><td>${f.value}</td><td>${
          f.contribution >= 0 ? "+" : ""
        }${(f.contribution * 100).toFixed(1)}%</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${assessment.id} — Clinical Report</title>
    <style>
      @page { size: A4 portrait; margin: 18mm 16mm 14mm 16mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #1a2332; margin: 0; line-height: 1.5; font-size: 12.5px; }
      .head { border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 22px; }
      .brand { display: flex; align-items: center; justify-content: space-between; }
      .brand .logo { font-size: 16px; font-weight: 700; color: #1d4ed8; letter-spacing: 0.02em; }
      .brand .logo span { color: #111827; font-weight: 400; }
      .brand .model { font-size: 11px; color: #556070; }
      .head h1 { font-size: 20px; margin: 10px 0 6px; letter-spacing: -0.01em; }
      .meta { color: #556070; font-size: 12px; }
      .meta b { color: #1a2332; }
      h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.07em; color: #1d4ed8; margin: 22px 0 8px; border-bottom: 1px solid #d7dee8; padding-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { text-align: left; padding: 5px 9px; border-bottom: 1px solid #eef1f5; }
      th { width: 38%; color: #556070; font-weight: 600; }
      ul { margin: 4px 0; padding-left: 18px; }
      li { margin-bottom: 4px; }
      .summary { display: flex; gap: 22px; flex-wrap: wrap; }
      .summary .stat { flex: 1; min-width: 120px; }
      .summary .stat strong { display: block; font-size: 20px; }
      .summary .stat span { font-size: 11px; color: #556070; text-transform: uppercase; letter-spacing: 0.04em; }
      .note { font-style: italic; color: #4b5563; font-size: 12.5px; }
      .disclaimer { margin-top: 26px; padding: 12px 14px; border: 1px solid #d7dee8; border-radius: 8px; background: #f5f7fa; }
      .disclaimer-title { margin: 0 0 4px; border: none; text-transform: none; letter-spacing: 0.02em; color: #4b5563; }
      .disclaimer-text { margin: 0; color: #4b5563; font-size: 11.5px; line-height: 1.5; }
      .footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #d7dee8; font-size: 10px; color: #8b95a3; text-align: center; }
      .footer strong { color: #556070; }
      @media print { body { margin: 0; } }
    </style>
  </head>
  <body>
    <div class="head">
      <div class="brand">
        <div class="logo">CardioInsight <span>AI</span></div>
        <div class="model">Model: ${model}</div>
      </div>
      <h1>Project: Cardiovascular Disease Risk Assessment</h1>
      <div class="meta">
        Assessment ID: <b>${assessment.id}</b> &middot; Date &amp; Time: <b>${formatDateTime(assessment.createdAt)}</b>
      </div>
    </div>

    <h2>Risk Summary</h2>
    <div class="summary">
      <div class="stat"><strong>${formatPercent(result.probability)}</strong><span>Predicted CVD Risk</span></div>
      <div class="stat"><strong>${result.level}</strong><span>Risk Category</span></div>
      <div class="stat"><strong>${formatPercent(result.confidence, 0)}</strong><span>Confidence Score</span></div>
    </div>
    <p class="note">${result.interpretation}</p>

    <h2>Clinical Measurements</h2>
    <table>${htmlInputRows || "<tr><td>—</td></tr>"}</table>

    <h2>Feature Attribution (SHAP)</h2>
    <table>
      <tr><th>Feature</th><th>Value</th><th>Contribution</th></tr>
      ${factorRows}
    </table>

    <h2>Clinical Recommendations</h2>
    <ul>${list(result.recommendations.medical)}</ul>

    <h2>Lifestyle Recommendations</h2>
    <ul>${list(result.recommendations.lifestyle)}</ul>

    <h2>Monitoring Recommendations</h2>
    <ul>${list(result.recommendations.monitoring)}</ul>

    <div class="disclaimer">
      <h2 class="disclaimer-title">AI Health Disclaimer</h2>
      <p class="disclaimer-text">Disclaimer: This AI-generated assessment is for informational and research purposes only and is not a medical diagnosis. Consult a qualified healthcare professional for health-related concerns.</p>
    </div>

    <div class="footer">
      <strong>CardioInsight AI</strong> &middot; Generated by CardioInsight AI Platform v1.0.0 &middot;
      Research and demonstration purposes only. Not a substitute for professional medical advice.
    </div>
  </body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Download helpers                                                    */
/* ------------------------------------------------------------------ */

function triggerDownload(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function slug(assessment: AssessmentResult): string {
  return assessment.id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function downloadJson(assessment: AssessmentResult) {
  triggerDownload(
    `cardioinsight-report-${slug(assessment)}.json`,
    JSON.stringify(assessment, null, 2),
    "application/json;charset=utf-8",
  );
}

export function downloadCsv(assessment: AssessmentResult) {
  const { result } = assessment;
  const rows = inputRows(assessment.input);
  const flat: Record<string, string | number> = {
    assessment_id: assessment.id,
    created_at: assessment.createdAt,
    model: assessment.model,
    risk_probability: result.probability,
    risk_level: result.level,
    confidence: result.confidence,
    top_factors: result.topFactors.map((f) => f.name).join("; "),
  };
  rows.forEach((row, index) => {
    flat[`input_${index}_${row.label.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`] =
      row.value;
  });

  const header = Object.keys(flat).join(",");
  const value = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const row = Object.values(flat).map(value).join(",");
  triggerDownload(
    `cardioinsight-report-${slug(assessment)}.csv`,
    `${header}\n${row}\n`,
    "text/csv;charset=utf-8",
  );
}

function openPrintWindow(assessment: AssessmentResult) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(buildReportHtml(assessment));
  win.document.close();
  win.focus();
  // Print the popup so the user can save it as a PDF (Export PDF) or
  // send it straight to a printer (Print Report).
  win.setTimeout(() => {
    win.print();
  }, 350);
}

export function exportPdf(assessment: AssessmentResult) {
  openPrintWindow(assessment);
}

export function printReport(assessment: AssessmentResult) {
  openPrintWindow(assessment);
}

export type { RiskResult };