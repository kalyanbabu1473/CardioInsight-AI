/**
 * AssessmentProvider — app-level provider that owns shared assessment state
 * (current report + history). Lives above both the Assessment page (data
 * entry) and the Reports page (results) so a completed assessment can be
 * handed from one to the other across navigation. History is loaded from the
 * CardioInsight persistence API (`GET /assessments`, `GET /assessments/latest`)
 * and survives page refreshes.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AssessmentResult } from "./assessmentResult";
import {
  createAssessment,
  getLatestAssessment,
  listAssessments,
} from "./assessmentRepository";
import type { AssessmentInput } from "./assessmentService";
import {
  AssessmentContext,
  type AssessmentContextValue,
} from "./useAssessment";

export default function AssessmentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [current, setCurrent] = useState<AssessmentResult | null>(null);
  const [latestAssessment, setLatestAssessment] =
    useState<AssessmentResult | null>(null);
  const [hasSessionAssessment, setHasSessionAssessment] = useState(false);
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const historyRef = useRef<AssessmentResult[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([listAssessments(), getLatestAssessment()])
      .then(([items, latest]) => {
        if (!active) return;
        const sorted = [...items].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setHistory(sorted);
        historyRef.current = sorted;
        setCurrent(sorted[0] ?? null);
        setLatestAssessment(latest ?? sorted[0] ?? null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitAssessment = useCallback(async (input: AssessmentInput) => {
    // The ML service is the only risk engine — no offline heuristic fallback.
    // If the backend is unreachable the error propagates to the wizard, which
    // surfaces it to the user rather than substituting an approximate result.
    const assessment = await createAssessment(input);
    setHasSessionAssessment(true);
    setHistory((prev) => {
      const next = [assessment, ...prev];
      historyRef.current = next;
      return next;
    });
    setLatestAssessment(assessment);
    setCurrent(assessment);
    return assessment;
  }, []);

  const selectAssessment = useCallback(async (id: string) => {
    const found = historyRef.current.find((a) => a.id === id) ?? null;
    setCurrent(found);
  }, []);

  const clearCurrent = useCallback(() => setCurrent(null), []);

  const value = useMemo<AssessmentContextValue>(
    () => ({
      current,
      latestAssessment,
      history,
      hasAssessment: latestAssessment !== null,
      hasSessionAssessment,
      isLoading,
      submitAssessment,
      selectAssessment,
      clearCurrent,
    }),
    [
      current,
      latestAssessment,
      hasSessionAssessment,
      history,
      isLoading,
      submitAssessment,
      selectAssessment,
      clearCurrent,
    ],
  );

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}