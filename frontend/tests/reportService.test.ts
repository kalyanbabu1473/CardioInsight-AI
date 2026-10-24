import { describe, expect, it } from "vitest";

import type { AssessmentResult } from "@/features/assessment/assessmentResult";
import {
  buildReportHtml,
  certaintyPercent,
  escapeHtml,
  formatCertainty,
} from "@/features/reports/reportService";
import { createInitialInput } from "@/features/assessment/assessmentService";

function hostileAssessment(): AssessmentResult {
  const input = createInitialInput();
  input.demographics = { age: 48, sex: "Female" };
  input.bodyComposition = { weightKg: 74, heightCm: 172, waistCm: 86 };
  input.bloodPressure = {
    systolicBP: 128,
    diastolicBP: 82,
    hypertensionDiagnosis: "No",
  };
  input.metabolic = { hba1c: 5.6, fastingGlucose: 102, insulin: 14 };
  input.lipids = {
    totalCholesterol: 208,
    ldlCholesterol: 132,
    hdlCholesterol: 46,
    triglycerides: 168,
  };
  input.lifestyle = { everSmoked100: "Yes", currentSmoking: "Not at all" };

  return {
    id: '<img src=x onerror="alert(1)">',
    createdAt: "2026-01-01T00:00:00Z",
    model: '<script>alert("model")</script>',
    modelTagline: "Test",
    input,
    result: {
      probability: 0.0359,
      level: "Low",
      confidence: 96.41,
      interpretation: "<script>alert('interpretation')</script>",
      topFactors: [
        {
          name: "<b>Age</b>",
          value: '<img src=x onerror="alert(2)">',
          contribution: 0.12,
        },
      ],
      recommendations: {
        lifestyle: ["<script>alert('lifestyle')</script>"],
        monitoring: ["<img src=x onerror=alert(3)>"],
        medical: ["Routine care."],
      },
    },
  };
}

describe("escapeHtml", () => {
  it("escapes all HTML metacharacters", () => {
    expect(escapeHtml('&<>"\'')).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("stringifies null and undefined as empty text", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("certainty formatting", () => {
  it("normalizes legacy 0-1 certainty and current 0-100 certainty", () => {
    expect(certaintyPercent(0.8822)).toBeCloseTo(88.22, 5);
    expect(certaintyPercent(88.22)).toBe(88.22);
    expect(formatCertainty(0.0359)).toBe("4%");
    expect(formatCertainty(96.41)).toBe("96%");
  });
});

describe("buildReportHtml", () => {
  it("escapes patient, model, interpretation, factor, and recommendation text", () => {
    const html = buildReportHtml(hostileAssessment());
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x");
    expect(html).toContain("&lt;b&gt;Age&lt;/b&gt;");
    expect(html).toContain("3.6%");
    expect(html).toContain("96%");
  });

  it("keeps the risk probability and certainty semantically separate", () => {
    const html = buildReportHtml(hostileAssessment());
    expect(html).toContain("Predicted CVD Risk");
    expect(html).toContain("Prediction Certainty");
    expect(html).toContain("not the probability that the prediction is correct");
  });
});
