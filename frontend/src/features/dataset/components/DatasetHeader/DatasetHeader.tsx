import { Reveal } from "@/components/motion";
import { Download } from "lucide-react";
import { CheckoutCard } from "@/components/ui";

import styles from "./DatasetHeader.module.css";
import { projectInfo } from "@/data/dashboard/project";

export default function DatasetHeader() {
  return (
    <Reveal>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Dataset Explorer
          </h1>

          <p className={styles.description}>
            Explore the curated NHANES dataset used throughout the
            machine learning pipeline for cardiovascular disease risk
            prediction.
          </p>
        </div>

        <div className={styles.aside}>
          <div className={styles.badge}>
            {projectInfo.dataset}
          </div>

          <a
            className={styles.download}
            href="/datasets/FINAL_CVD_MASTER_DATASET.csv"
            download="FINAL_CVD_MASTER_DATASET.csv"
          >
            <Download size={16} />
            Download Master Dataset
          </a>

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
        </div>
      </section>
    </Reveal>
  );
}