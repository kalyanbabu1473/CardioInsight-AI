import type { CSSProperties } from "react";

import { explainabilityMethods } from "../explainabilityData";

import styles from "./MethodCards.module.css";

export default function MethodCards() {
  return (
    <div className={styles.grid}>
      {explainabilityMethods.map((method) => {
        const Icon = method.icon;
        const style = { "--accent": method.tone } as CSSProperties;

        return (
          <div key={method.name} className={styles.card} style={style}>
            <div className={styles.iconWrap}>
              <Icon size={22} strokeWidth={2} />
            </div>

            <h3>{method.name}</h3>
            <p>{method.description}</p>

            <span className={styles.tag}>{method.tag}</span>
          </div>
        );
      })}
    </div>
  );
}