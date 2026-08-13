import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import clsx from "clsx";

import { metricKeys, metricLabels, models } from "../modelsData";

import styles from "./ComparisonTable.module.css";

type SortKey = (typeof metricKeys)[number] | "name";
type SortDir = "asc" | "desc";

const getValue = (
  name: string,
  key: SortKey,
): number => {
  const model = models.find((m) => m.name === name)!;
  if (key === "name") return 0;
  return model.metrics.find((m) => m.label === metricLabels[key])!.value;
};

const maxFor = (key: SortKey): number => {
  if (key === "name") return 1;
  return Math.max(
    ...models.map((m) => m.metrics.find((x) => x.label === metricLabels[key])!.value),
  );
};

export default function ComparisonTable() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rocAuc");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const visibleModels = useMemo(() => {
    const filtered = models.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase()),
    );

    return [...filtered].sort((a, b) => {
      const av = getValue(a.name, sortKey);
      const bv = getValue(b.name, sortKey);
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            type="search"
            placeholder="Search models..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search models"
          />
        </div>
        <span className={styles.hint}>Tap a column header to sort</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <button
                  className={styles.sortBtn}
                  onClick={() => toggleSort("name")}
                  aria-label="Sort by model"
                >
                  Model <ArrowUpDown size={14} />
                </button>
              </th>
              {metricKeys.map((key) => (
                <th key={key}>
                  <button
                    className={styles.sortBtn}
                    onClick={() => toggleSort(key)}
                  >
                    {metricLabels[key]} <ArrowUpDown size={14} />
                    {sortKey === key && (
                      <span className={styles.arrow}>{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
              ))}
              <th>Best Use</th>
            </tr>
          </thead>
          <tbody>
            {visibleModels.map((model) => (
              <tr
                key={model.id}
                className={clsx(model.production && styles.productionRow)}
              >
                <td className={styles.modelCell}>
                  <span>{model.name}</span>
                  {model.production && <span className={styles.prodTag}>★</span>}
                </td>
                {metricKeys.map((key) => {
                  const value = getValue(model.name, key);
                  const isBest = value === maxFor(key);
                  return (
                    <td key={key} className={clsx(isBest && styles.bestCell)}>
                      {value.toFixed(4)}
                    </td>
                  );
                })}
                <td className={styles.useCell}>{model.bestUseCase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>
        <span className={styles.noteBest}>Highlighted</span> cells mark the best
        value for each metric. ★ marks the research champion (Random Forest);
        the deployed classifier is the 20-feature CardioAI Assessment Model.
      </p>
    </div>
  );
}