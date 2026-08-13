import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  FileCode2,
  Files,
  FolderKanban,
  Search,
  Workflow,
} from "lucide-react";
import type { ComponentType } from "react";
import type { SearchItem, SearchItemType } from "../../../data/search/searchIndex";
import { searchIndex, typeLabels } from "../../../data/search/searchIndex";
import { soundService } from "@/services/ui/soundService";
import styles from "./GlobalSearch.module.css";

const TYPE_ICONS: Record<SearchItemType, ComponentType<{ size?: number }>> = {
  page: FolderKanban,
  notebook: FileCode2,
  dataset: Files,
  model: Workflow,
};

function matches(query: string, item: SearchItem): boolean {
  const haystack = [item.label, item.detail, ...item.keywords]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return searchIndex.filter((item) => matches(q, item));
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(item: SearchItem) {
    soundService.play("tick");
    navigate(item.path);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!open || results.length === 0) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className={styles.wrapper} ref={containerRef} data-sound-handled>
      <div className={styles.search}>
        <Search className={styles.searchIcon} size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            soundService.play("tick");
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search datasets, notebooks, models..."
          aria-label="Global search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          aria-activedescendant={
            showDropdown && results[activeIndex]
              ? `search-option-${results[activeIndex].id}`
              : undefined
          }
        />
        {showDropdown && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            onClick={() => {
              soundService.play("tick");
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div className={styles.dropdown} id="global-search-results" role="listbox">
          {results.length > 0 ? (
            results.map((item, index) => {
              const Icon = TYPE_ICONS[item.type];
              return (
                <button
                  type="button"
                  key={item.id}
                  role="option"
                  id={`search-option-${item.id}`}
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex
                      ? `${styles.option} ${styles.active}`
                      : styles.option
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <span className={styles.typeIcon}>
                    <Icon size={16} />
                  </span>
                  <span className={styles.optionMeta}>
                    <span className={styles.optionLabel}>{item.label}</span>
                    <span className={styles.optionDetail}>{item.detail}</span>
                  </span>
                  <span className={styles.typeTag}>{typeLabels[item.type]}</span>
                  <ArrowRight className={styles.goIcon} size={14} />
                </button>
              );
            })
          ) : (
            <p className={styles.empty}>No results for “{query}”</p>
          )}
        </div>
      )}
    </div>
  );
}