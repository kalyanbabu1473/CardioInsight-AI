import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiCreateAssessment } from "@/services/api/assessmentApi";
import type { AssessmentResult } from "@/features/assessment/assessmentResult";
import { createAssessment } from "@/features/assessment/assessmentRepository";
import type { AssessmentInput } from "@/features/assessment/assessmentService";

vi.mock("@/services/api/assessmentApi", () => ({
  apiCreateAssessment: vi.fn(),
  apiGetAssessment: vi.fn(),
  apiGetLatestAssessment: vi.fn(),
  apiListAssessments: vi.fn(),
}));

const input: AssessmentInput = {
  demographics: { age: 48, sex: "Female" },
  bodyComposition: { weightKg: 74, heightCm: 172, waistCm: 86 },
  bloodPressure: {
    systolicBP: 128,
    diastolicBP: 82,
    hypertensionDiagnosis: "No",
  },
  metabolic: { hba1c: 5.6, fastingGlucose: 102, insulin: 14 },
  lipids: {
    totalCholesterol: 208,
    ldlCholesterol: 132,
    hdlCholesterol: 46,
    triglycerides: 168,
  },
  lifestyle: { everSmoked100: "Yes", currentSmoking: "Some days" },
};

const serverRecord = {
  id: "CI-20261024-0001",
  createdAt: "2026-10-24T00:00:00+00:00",
  model: "Random Forest (Clinical CVD - 18 features)",
  modelTagline: "Calibrated Clinical Model",
  legacy: false,
  input,
  result: {
    probability: 0.0097,
    level: "Low",
    confidence: 99.03,
    interpretation: "server interpretation",
    topFactors: [{ name: "Age", value: "48 years", contribution: -0.1 }],
    recommendations: {
      lifestyle: ["server lifestyle"],
      monitoring: ["server monitoring"],
      medical: ["server medical"],
    },
  },
} as AssessmentResult;

describe("createAssessment", () => {
  beforeEach(() => {
    vi.mocked(apiCreateAssessment).mockReset();
    vi.mocked(apiCreateAssessment).mockResolvedValue(serverRecord);
  });

  it("posts only validated input and returns the server-owned result", async () => {
    const result = await createAssessment(input);

    expect(apiCreateAssessment).toHaveBeenCalledTimes(1);
    expect(apiCreateAssessment).toHaveBeenCalledWith({ input });
    expect(result).toBe(serverRecord);
    expect(result.result.interpretation).toBe("server interpretation");
    expect(result.result.topFactors).toEqual(serverRecord.result.topFactors);
  });
});
