/**
 * useIntro — the intro-gate context value + hook. The provider component lives
 * in IntroGate.tsx; keeping the hook in its own file follows the project's
 * fast-refresh convention (see app/useTheme.ts).
 */

import { createContext, useContext } from "react";

export interface IntroContextValue {
  /** "intro" while the splash is on screen, "hero" once it has finished. */
  phase: "intro" | "hero";
  /** True when the intro was skipped (reload / reduced motion). */
  skipped: boolean;
}

export const IntroContext = createContext<IntroContextValue | null>(null);

/** Read the intro state; defaults to "hero/skipped" outside the provider. */
export function useIntro(): IntroContextValue {
  return useContext(IntroContext) ?? { phase: "hero", skipped: true };
}