import { Search } from "lucide-react";
import { categories } from "@/data/dataset/categories";
import styles from "./VariableSearch.module.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export default function VariableSearch({
  value,
  onChange,
  category,
  onCategoryChange,
}: Props) {
  return (
    <section className={styles.container}>
      <div className={styles.searchBox}>
        <Search size={18} />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search features..."
        />
      </div>

      <select
        className={styles.select}
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <div className={styles.counter}>
        {value ? "Filtered Results" : `${categories.length - 1} Categories`}
      </div>
    </section>
  );
}