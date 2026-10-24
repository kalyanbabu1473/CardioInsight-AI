import { describe, expect, it } from "vitest";

import {
  calculateBmi,
  createInitialInput,
  validateStep,
  type AssessmentInput,
  type SexOption,
  type SmokingStatusOption,
} from "@/features/assessment/assessmentService";

function validInput(): AssessmentInput {
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
  return input;
}

describe("calculateBmi", () => {
  it("derives BMI from measured height and weight", () => {
    expect(calculateBmi(172, 74)).toBeCloseTo(25.0135, 3);
  });

  it("returns 0 for non-finite, zero, or negative measurements", () => {
    expect(calculateBmi(Number.NaN, 74)).toBe(0);
    expect(calculateBmi(172, Number.POSITIVE_INFINITY)).toBe(0);
    expect(calculateBmi(0, 74)).toBe(0);
    expect(calculateBmi(-172, 74)).toBe(0);
    expect(calculateBmi(172, -74)).toBe(0);
  });
});

describe("validateStep body composition", () => {
  it("accepts a valid height, weight, waist, and derived BMI", () => {
    expect(validateStep(2, validInput())).toEqual({});
  });

  it("rejects a derived BMI below the contract minimum", () => {
    const input = validInput();
    input.bodyComposition.heightCm = 78.3;
    input.bodyComposition.weightKg = 7.29;
    expect(validateStep(2, input).BMXBMI).toMatch(/Body mass index must be/);
  });

  it("rejects a derived BMI above the contract maximum", () => {
    const input = validInput();
    input.bodyComposition.heightCm = 78.3;
    input.bodyComposition.weightKg = 56.59;
    expect(validateStep(2, input).BMXBMI).toMatch(/Body mass index must be/);
  });

  it("rejects NaN rather than treating it as in range", () => {
    const input = validInput();
    input.bodyComposition.heightCm = Number.NaN;
    expect(validateStep(2, input).BMXHT).toBeDefined();
  });

  it("rejects a height that is outside the contract", () => {
    const input = validInput();
    input.bodyComposition.heightCm = 78.2;
    expect(validateStep(2, input).BMXHT).toBeDefined();
  });

  it("rejects pediatric age outside the adult training cohort", () => {
    const input = validInput();
    input.demographics.age = 17;
    expect(validateStep(1, input).RIDAGEYR).toBeDefined();
  });
});

describe("validateStep categorical fields", () => {
  it("rejects an invalid sex option", () => {
    const input = validInput();
    input.demographics.sex = "Maybe" as SexOption;
    expect(validateStep(1, input).RIAGENDR).toBeDefined();
  });

  it("rejects an invalid smoking status", () => {
    const input = validInput();
    input.lifestyle.currentSmoking = "Maybe" as SmokingStatusOption;
    expect(validateStep(6, input).SMQ040).toBeDefined();
  });

  it("accepts every valid smoking status", () => {
    for (const status of ["Every day", "Some days", "Not at all"] as const) {
      const input = validInput();
      input.lifestyle.currentSmoking = status;
      expect(validateStep(6, input)).toEqual({});
    }
  });

  it("rejects current smoking when the patient never smoked", () => {
    const input = validInput();
    input.lifestyle = { everSmoked100: "No", currentSmoking: "Some days" };
    expect(validateStep(6, input).SMQ040).toMatch(/Never|never|Not at all/);
  });

  it("accepts a never smoker who is not currently smoking", () => {
    const input = validInput();
    input.lifestyle = { everSmoked100: "No", currentSmoking: "Not at all" };
    expect(validateStep(6, input)).toEqual({});
  });
});
