import { useState } from "react";

import styles from "./DatasetPage.module.css";

import DatasetHeader from "./components/DatasetHeader";
import DatasetStats from "./components/DatasetStats";
import VariableSearch from "./components/VariableSearch";
import VariableTable from "./components/VariableTable";
import FeatureDetails from "./components/FeatureDetails";

import type { Variable } from "./types/variable";

export default function DatasetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");

  const [selectedVariable, setSelectedVariable] =
    useState<Variable | null>(null);

  return (
    <div className={styles.page}>
      <DatasetHeader />

      <DatasetStats />

      <VariableSearch
        value={searchTerm}
        onChange={setSearchTerm}
        category={category}
        onCategoryChange={setCategory}
      />

      <VariableTable
        searchTerm={searchTerm}
        category={category}
        onView={setSelectedVariable}
      />

      <FeatureDetails
        variable={selectedVariable}
        onClose={() => setSelectedVariable(null)}
      />
    </div>
  );
}