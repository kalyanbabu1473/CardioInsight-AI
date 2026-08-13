import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import type { AssessmentResult } from "@/features/assessment/assessmentResult";
import { A4_PRINT_PAGE_STYLE } from "../printStyles";

interface UsePrintReportResult {
  printRef: React.RefObject<HTMLDivElement | null>;
  handlePrint: () => void;
  isPrinting: boolean;
}

/**
 * Drives react-to-print for a WYSIWYG A4 PDF clone of the report.
 *
 * react-to-print clones the node referenced by `printRef` (plus the copied
 * global + module stylesheets) into a hidden iframe, applies A4 page styling,
 * and opens the browser print dialog so the user can save as PDF or print.
 */
export function usePrintReport(assessment: AssessmentResult | null): UsePrintReportResult {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: () => (assessment ? `CVD-Risk-Report-${assessment.id}` : "CVD-Risk-Report"),
    pageStyle: A4_PRINT_PAGE_STYLE,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => setIsPrinting(false),
    onPrintError: () => setIsPrinting(false),
    suppressErrors: true,
  });

  return { printRef, handlePrint, isPrinting };
}