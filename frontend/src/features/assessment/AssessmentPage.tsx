import { motion } from "framer-motion";
import { Cpu, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui";
import AssessmentWizard from "./components/AssessmentWizard";

import styles from "./AssessmentPage.module.css";

export default function AssessmentPage() {
  return (
    <div className={styles.page}>
      <motion.header
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.heroBody}>
          <div className={styles.eyebrow}>
            <Badge variant="primary">
              <Cpu size={13} />
              Random Forest · Production Model
            </Badge>
          </div>
          <h1>Cardiovascular Risk Assessment</h1>
          <p>
            Collect patient information and generate an AI-powered
            cardiovascular disease risk assessment using the trained Random
            Forest model. Your results open as a full clinical report.
          </p>
        </div>
      </motion.header>

      <AssessmentWizard />

      <motion.footer
        className={styles.disclaimer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Stethoscope size={15} />
        This tool is for research and demonstration purposes only and does not
        constitute medical advice. Always consult a qualified clinician.
      </motion.footer>
    </div>
  );
}