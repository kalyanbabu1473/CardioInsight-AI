import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  type Variants,
} from "framer-motion";
import { ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { soundService } from "@/services/ui/soundService";

import {
  createInitialInput,
  hasErrors,
  stepLabel,
  validateStep,
  type AssessmentInput,
  type StepErrors,
} from "../assessmentService";
import { useAssessment } from "../useAssessment";
import AssessmentStepper from "./AssessmentStepper";
import AssessmentSection from "./AssessmentSection";
import PatientSummary from "./PatientSummary";
import { REVIEW_STEP, WIZARD_STEPS } from "./wizardConfig";
import CategoryStep from "./steps/CategoryStep";
import ReviewStep from "./steps/ReviewStep";
import RunLoading from "./RunLoading";

import styles from "../AssessmentPage.module.css";

const REQUIRED_STEPS = WIZARD_STEPS.filter((s) => s.category).map((s) => s.index);

const EASE = [0.22, 1, 0.36, 1] as const;

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: EASE },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.25, ease: EASE },
  }),
};

export default function AssessmentWizard() {
  const [input, setInput] = useState<AssessmentInput>(() => createInitialInput());
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const shakeControls = useAnimationControls();
  const navigate = useNavigate();
  const { submitAssessment } = useAssessment();
  const { showToast } = useToast();

  const clearErrorsFor = (keys: string[]) => {
    setErrors((prev) => {
      const hasRelevant = keys.some((key) => key in prev);
      if (!hasRelevant) return prev;
      const next = { ...prev };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  };

  const updateCategoryField = <K extends keyof AssessmentInput>(
    category: K,
    patch: Partial<AssessmentInput[K]>,
  ) => {
    setInput((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...patch },
    }));
    clearErrorsFor(Object.keys(patch));
  };

  const navigateStep = (to: number, dir: 1 | -1) => {
    setDirection(dir);
    setStep(to);
    setErrors({});
  };

  const markComplete = (completedStep: number) => {
    setCompletedSteps((prev) =>
      prev.includes(completedStep) ? prev : [...prev, completedStep],
    );
  };

  const handleNext = () => {
    const stepErrors = validateStep(step, input);
    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      void shakeControls.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.4, ease: "easeOut" },
      });
      return;
    }

    setErrors({});
    markComplete(step);
    soundService.play("success");
    window.setTimeout(() => soundService.play("next"), 60);
    navigateStep(step + 1, 1);
  };

  const handlePrevious = () => {
    if (step <= 1) return;
    soundService.play("previous");
    navigateStep(step - 1, -1);
  };

  const handleStepClick = (target: number) => {
    soundService.play("navigation");
    navigateStep(target, target > step ? 1 : -1);
  };

  const handleEdit = (target: number) => {
    soundService.play("navigation");
    navigateStep(target, target > step ? 1 : -1);
  };

  const handleRun = async () => {
    if (submitting) return;
    setSubmitting(true);
    soundService.play("run");
    try {
      const assessment = await submitAssessment(input);
      showToast({
        kind: "success",
        title: "Assessment completed successfully.",
        message: `${assessment.id} · ${assessment.model}`,
      });
      navigate("/reports");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Assessment submission failed:", error);
      }
      showToast({
        kind: "error",
        title: "Assessment failed.",
        message: "Unable to run the assessment. Please try again.",
      });
      setSubmitting(false);
    }
  };

  const requiredDone = REQUIRED_STEPS.every((s) => completedSteps.includes(s));
  const maxReachableStep = requiredDone
    ? WIZARD_STEPS.length
    : Math.max(
        step,
        completedSteps.filter((s) => REQUIRED_STEPS.includes(s)).length + 1,
      );

  const stepDef = WIZARD_STEPS[step - 1];
  const hasCurrentErrors = hasErrors(errors);
  const noContinueToReview = WIZARD_STEPS[step - 1].category === undefined;

  const renderStepContent = () => {
    const category = stepDef.category;
    if (category) {
      return (
        <CategoryStep
          category={category}
          value={
            input[category as keyof AssessmentInput] as unknown as Record<
              string,
              number | string
            >
          }
          onChange={(patch) =>
            updateCategoryField(
              category as keyof AssessmentInput,
              patch as Partial<AssessmentInput[keyof AssessmentInput]>,
            )
          }
          errors={errors}
        />
      );
    }
    return (
      <ReviewStep value={input} onEdit={handleEdit} onSubmit={handleRun} />
    );
  };

  const showNext = step < REVIEW_STEP;
  const showPrevious = step > 1;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <AssessmentStepper
          currentStep={step}
          maxReachableStep={maxReachableStep}
          onStepClick={handleStepClick}
        />
      </motion.div>

      <div className={styles.grid}>
        <AnimatePresence mode="wait" initial={false}>
          {submitting ? (
            <motion.div
              key="running"
              className={styles.leftWide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <RunLoading />
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              className={styles.left}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <motion.div animate={shakeControls}>
                    <AssessmentSection
                      icon={stepDef.icon}
                      title={stepLabel(step)}
                      description={stepDef.description}
                      stepNumber={`Step ${step} of ${WIZARD_STEPS.length}`}
                    >
                      <AnimatePresence initial={false}>
                        {hasCurrentErrors && (
                          <motion.div
                            className={styles.validationBanner}
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                              marginBottom: "var(--space-4)",
                            }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <Stethoscope size={15} />
                            Please complete the required fields highlighted below.
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {renderStepContent()}
                    </AssessmentSection>

                    {(showPrevious || showNext) && (
                      <nav className={styles.nav}>
                        <Button
                          variant="secondary"
                          size="lg"
                          disabled={!showPrevious}
                          onClick={handlePrevious}
                        >
                          <ArrowLeft size={18} />
                          Previous
                        </Button>

                        <span className={styles.navStep}>
                          {stepLabel(step)} · Step {step} of {WIZARD_STEPS.length}
                        </span>

                        {showNext && (
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={handleNext}
                            disabled={noContinueToReview}
                          >
                            {step === REVIEW_STEP - 1 ? "Continue to Review" : "Next Step"}
                            <ArrowRight size={18} />
                          </Button>
                        )}
                      </nav>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.right}>
          <PatientSummary
            completedSteps={completedSteps}
            currentStep={step}
            result={null}
          />
        </div>
      </div>
    </>
  );
}