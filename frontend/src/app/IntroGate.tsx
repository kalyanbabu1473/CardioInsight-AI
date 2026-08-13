import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import { IntroContext, type IntroContextValue } from "./useIntro";

import styles from "./IntroGate.module.css";

const STORAGE_KEY = "cardioinsight-intro-v1";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export default function IntroGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "hero">("intro");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      if (seen === "on" || prefersReducedMotion()) {
        setSkipped(true);
        setPhase("hero");
      } else {
        sessionStorage.setItem(STORAGE_KEY, "on");
      }
    } catch {
      setSkipped(true);
      setPhase("hero");
    }
  }, []);

  const value = useMemo<IntroContextValue>(
    () => ({ phase, skipped }),
    [phase, skipped],
  );

  return (
    <IntroContext.Provider value={value}>
      {children}
      <IntroSplash phase={phase} onComplete={() => setPhase("hero")} />
    </IntroContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Splash overlay                                                      */
/* ------------------------------------------------------------------ */

type SplashStage = "title" | "subtitle" | "author" | "done";

const ease = [0.22, 1, 0.36, 1] as const;

function IntroSplash({
  phase,
  onComplete,
}: {
  phase: "intro" | "hero";
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<SplashStage>("title");

  useEffect(() => {
    if (phase !== "intro") return;

    const timers = [
      window.setTimeout(() => setStage("subtitle"), 1800),
      window.setTimeout(() => setStage("author"), 2650),
      window.setTimeout(() => setStage("done"), 3300),
      window.setTimeout(onComplete, 3950),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, onComplete]);

  const showSubtitle = stage === "subtitle" || stage === "author" || stage === "done";
  const showAuthor = stage === "author" || stage === "done";

  return (
    <AnimatePresence>
      {phase === "intro" && (
        <motion.div
          className={styles.splash}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <motion.h1
            layoutId="intro-morph-title"
            className={styles.title}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(28px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.8, ease }}
          >
            CardioInsight AI Platform
          </motion.h1>

          <motion.div
            className={styles.project}
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={
              showSubtitle
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 20, filter: "blur(10px)" }
            }
            transition={{ duration: 0.8, ease }}
          >
            <span className={styles.projectLabel}>Project</span>
            <p className={styles.projectText}>
              Machine Learning&ndash;Based Analysis of Gene, Dietary, and
              Environmental Factors Influencing Cardiovascular Disease Risk
            </p>
          </motion.div>

          <motion.p
            className={styles.author}
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={
              showAuthor
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 16, filter: "blur(8px)" }
            }
            transition={{ duration: 0.7, ease }}
          >
            &mdash; by Kalyan
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
