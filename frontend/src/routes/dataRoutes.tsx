import { SkeletonPage } from "@/components/ui/Skeleton";
import { useAssessment } from "@/features/assessment/useAssessment";

import AssessmentPage from "@/features/assessment/AssessmentPage";
import ReportsPage from "@/features/reports/ReportsPage";

/**
 * Data-driven routes show a real skeleton until their async data is ready,
 * so a browser refresh never flashes empty space and the skeleton only
 * disappears when genuine loading has finished.
 */
export function ReportsRoute() {
  const { isLoading } = useAssessment();
  return (
    <SkeletonPage variant="reports" loading={isLoading}>
      <ReportsPage />
    </SkeletonPage>
  );
}

export function AssessmentRoute() {
  const { isLoading } = useAssessment();
  return (
    <SkeletonPage variant="assessment" loading={isLoading}>
      <AssessmentPage />
    </SkeletonPage>
  );
}