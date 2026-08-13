/**
 * API client — thin axios wrapper around the CardioInsight persistence API.
 *
 * The backend base URL is resolved from the centralized config
 * (`src/services/api/config.ts`), which reads `VITE_API_BASE_URL`. In local
 * development it defaults to the relative `/api` path, which the Vite dev
 * server proxies to the FastAPI server.
 */

import axios from "axios";

import type { AssessmentResult } from "@/features/assessment/assessmentResult";
import type { AssessmentInput } from "@/features/assessment/assessmentService";
import { API_BASE_URL } from "./config";

/** Payload the frontend sends to persist a completed assessment. */
export interface CreateAssessmentPayload {
  model: string;
  modelTagline: string;
  input: AssessmentInput;
  result: AssessmentResult["result"];
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

if (import.meta.env.DEV) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const method = (error.config?.method ?? "GET").toUpperCase();
        const url = error.config?.url ?? "";
        console.groupCollapsed(`[api] ${method} ${url} → ${error.response?.status ?? "network error"}`);
        console.error(error.response?.data ?? error.message);
        console.groupEnd();
      }
      return Promise.reject(error);
    },
  );
}

function toAssessmentResult(data: unknown): AssessmentResult {
  return data as AssessmentResult;
}

export async function apiListAssessments(): Promise<AssessmentResult[]> {
  const { data } = await client.get<unknown[]>("/assessments");
  return (data ?? []).map(toAssessmentResult);
}

export async function apiGetAssessment(id: string): Promise<AssessmentResult | null> {
  try {
    const { data } = await client.get<unknown>(`/assessments/${encodeURIComponent(id)}`);
    return toAssessmentResult(data);
  } catch {
    return null;
  }
}

export async function apiGetLatestAssessment(): Promise<AssessmentResult | null> {
  try {
    const { data } = await client.get<unknown>("/assessments/latest");
    return toAssessmentResult(data);
  } catch {
    return null;
  }
}

export async function apiCreateAssessment(
  payload: CreateAssessmentPayload,
): Promise<AssessmentResult> {
  const { data } = await client.post<unknown>("/assessments", payload);
  return toAssessmentResult(data);
}

/** Backend ML response from POST /api/predict (44-feature Random Forest). */
export interface BackendPrediction {
  model: string;
  probability: number;
  level: "Low" | "Moderate" | "High";
  confidence: number;
  feature_names: string[];
  feature_values: number[];
  expected_value: number;
  contributions: {
    feature: string;
    label: string;
    value: number;
    contribution: number;
  }[];
}

/** Runs the deployed Random Forest over the assessment inputs. */
export async function apiPredict(
  input: AssessmentInput,
): Promise<BackendPrediction> {
  const { data } = await client.post<unknown>("/predict", { input });
  return data as BackendPrediction;
}