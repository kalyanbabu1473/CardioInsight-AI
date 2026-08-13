import { memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Database, BrainCircuit, Activity } from "lucide-react";

import { Button } from "@/components/ui";

import styles from "./Hero.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const cards = [
  {
    icon: Database,
    title: "NHANES Dataset",
    value: "15,560",
    caption: "Participants",
  },
  {
    icon: BrainCircuit,
    title: "Selected Features",
    value: "44",
    caption: "Final Predictors",
  },
  {
    icon: Activity,
    title: "Target Variable",
    value: "Composite CVD",
    caption: "Binary Classification",
  },
];

export default memo(function Hero() {
  return (
    <section className={styles.hero}>
      <motion.div
        className={styles.left}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.span variants={item} className={styles.badge}>
          Machine Learning Research Project
        </motion.span>

        <motion.h1 variants={item}>
          Machine Learning–Based Analysis of Gene, Dietary, and
          Environmental Factors Influencing Cardiovascular Disease Risk
        </motion.h1>

        <motion.p variants={item}>
          A production-grade cardiovascular disease risk prediction platform
          developed using the NHANES 2017–2020 dataset. This project combines
          advanced feature engineering, machine learning, and interactive
          visualization to support cardiovascular risk assessment.
        </motion.p>

        <motion.div variants={item} className={styles.buttons}>
          <Link to="/dataset">
            <Button variant="primary" size="lg">
              Explore Dataset
            </Button>
          </Link>

          <Link to="/models">
            <Button variant="secondary" size="lg">
              View Models
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.right}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => (
          <motion.div
            key={card.title}
            className={styles.card}
            variants={item}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
          >
            <card.icon size={28} strokeWidth={2} />
            <h3>{card.title}</h3>
            <strong>{card.value}</strong>
            <span>{card.caption}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
});