import { memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { Button, CheckoutCard } from "@/components/ui";
import { useIntro } from "@/app/useIntro";
import { projectInfo } from "@/data/dashboard/project";
import leftSideVideo from "@/assets/illustrations/Videos/left_side_video.mp4";

import styles from "./Hero.module.css";

const stats = [
  {
    label: "Participants",
    value: projectInfo.participants.toLocaleString(),
  },
  {
    label: "Features Selected",
    value: projectInfo.selectedFeatures.toString(),
  },
  {
    label: "ML Notebooks",
    value: projectInfo.notebooks.toString(),
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.45 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export default memo(function Hero() {
  const { phase, skipped } = useIntro();
  const isHero = phase === "hero";

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <motion.h1
          layoutId={isHero ? "intro-morph-title" : undefined}
          className={styles.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          CardioInsight AI Platform
        </motion.h1>

        {isHero && (
          <motion.div
            className={styles.intro}
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.span variants={item} className={styles.badge}>
              {projectInfo.dataset} &middot; Machine Learning Research
            </motion.span>

            <motion.p variants={item} className={styles.subtitle}>
              Machine learning&ndash;based cardiovascular disease risk analysis,
              built from {projectInfo.participants.toLocaleString()} participants
              and {projectInfo.initialFeatures} NHANES variables.
            </motion.p>

            <motion.div variants={item} className={styles.stats}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={item} className={styles.actions}>
              <Link to="/assessment">
                <Button variant="primary" size="lg">
                  Run Assessment
                </Button>
              </Link>

              <Link to="/dataset">
                <Button variant="secondary" size="lg">
                  Explore Dataset
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>

      {isHero && (
        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease, delay: skipped ? 0.2 : 0.9 }}
        >
          <div className={styles.videoRing}>
            <video
              className={styles.video}
              src={leftSideVideo}
              autoPlay
              muted
              loop
              playsInline
              aria-label="CardioInsight AI platform preview"
            />
          </div>

                    <div className={styles.sourceRow}>
            <CheckoutCard />

            <a
              className={styles.dataLink}
              href="https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/default.aspx?Cycle=2017-2020"
              target="_blank"
              rel="noopener noreferrer"
            >
              NHANES 2017–2020 Data Source ↗
            </a>
          </div>
        </motion.div>
      )}
    </section>
  );
});