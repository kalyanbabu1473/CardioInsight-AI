import type { PropsWithChildren } from "react";
import { MotionConfig } from "framer-motion";
import ThemeProvider from "./theme";
import GlobalUiSound from "./GlobalUiSound";
import GlobalScrollSound from "./GlobalScrollSound";
import IntroGate from "./IntroGate";
import { ToastProvider } from "@/components/ui/Toast";
import AssessmentProvider from "@/features/assessment/AssessmentProvider";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <GlobalUiSound />
      <GlobalScrollSound />
      <MotionConfig reducedMotion="user">
        <IntroGate>
          <ToastProvider>
            <AssessmentProvider>{children}</AssessmentProvider>
          </ToastProvider>
        </IntroGate>
      </MotionConfig>
    </ThemeProvider>
  );
}