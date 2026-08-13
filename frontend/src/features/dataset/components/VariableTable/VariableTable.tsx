import type { CSSProperties } from "react";

import styles from "./VariableTable.module.css";
import { variables } from "@/data/dataset/variables";
import type { Variable } from "../../types/variable";

interface Props {
  searchTerm: string;
  category: string;
  onView: (variable: Variable) => void;
}

const domainTones: Record<string, string> = {
  "Body Measurements": "#3B82F6",
  "Blood Pressure": "#2563EB",
  Laboratory: "#60A5FA",
  Demographics: "#38BDF8",
  Diet: "#93C5FD",
  "Physical Activity": "#7DD3FC",
  Environmental: "#64748B",
  Smoking: "#94A3B8",
  Other: "#475569",
};

export default function VariableTable({
  searchTerm,
  category,
  onView,
}: Props) {
  const query = searchTerm.toLowerCase();

  const filteredVariables = variables.filter((variable) => {
    const matchesSearch =
      variable.name.toLowerCase().includes(query) ||
      variable.description.toLowerCase().includes(query);

    const matchesCategory =
      category === "All Categories" || variable.domain === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Description</th>
            <th>Domain</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {filteredVariables.length > 0 ? (
            filteredVariables.map((variable) => {
              const tone = domainTones[variable.domain] ?? "#475569";
              const style = { "--accent": tone } as CSSProperties;

              return (
                <tr
                  key={variable.name}
                  className={styles.row}
                  data-clickable
                  onClick={() => onView(variable)}
                >
                  <td>
                    <code className={styles.name}>{variable.name}</code>
                  </td>
                  <td className={styles.description}>
                    {variable.description}
                  </td>
                  <td>
                    <span className={styles.domainBadge} style={style}>
                      {variable.domain}
                    </span>
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      className={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(variable);
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className={styles.empty}>
                No matching features found. Try a different search or
                category.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}