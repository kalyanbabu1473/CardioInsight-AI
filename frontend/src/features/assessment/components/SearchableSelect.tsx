import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { clsx } from "clsx";

import { FieldError } from "./FormField";
import formStyles from "./FormField.module.css";
import styles from "./SearchableSelect.module.css";
import { soundService } from "@/services/ui/soundService";

export interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  options: readonly SearchableOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export default function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  error,
  hint,
  required,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const openList = () => {
    soundService.play("tick");
    setOpen((current) => !current);
  };

  const selectOption = (option: SearchableOption) => {
    soundService.play("tick");
    onChange(option.value);
    setOpen(false);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, filtered.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) selectOption(option);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const listboxId = `${id}-listbox`;

  return (
    <div className={formStyles.field} data-sound-handled>
      <label className={formStyles.label} htmlFor={id}>
        {label}
        {required && <span className={styles.requiredMark} aria-hidden="true">*</span>}
      </label>

      <div className={styles.select} ref={containerRef}>
        <button
          id={id}
          type="button"
          className={clsx(
            styles.trigger,
            error && formStyles.inputWrapError,
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-invalid={error ? true : undefined}
          onClick={openList}
          onKeyDown={handleTriggerKeyDown}
        >
          <span
            className={clsx(
              styles.triggerText,
              !selected && styles.triggerPlaceholder,
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={clsx(styles.chevron, open && styles.chevronOpen)}
            size={18}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  type="text"
                  value={query}
                  placeholder="Search…"
                  autoFocus
                  aria-label={`Search ${label}`}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleListKeyDown}
                />
              </div>

              <ul
                id={listboxId}
                role="listbox"
                aria-label={label}
                className={styles.list}
              >
                {filtered.map((option, index) => {
                  const active = index === activeIndex;
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      className={clsx(
                        styles.option,
                        active && styles.optionActive,
                        isSelected && styles.optionSelected,
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectOption(option);
                      }}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      {isSelected && (
                        <Check size={15} strokeWidth={2.6} className={styles.optionCheck} />
                      )}
                    </li>
                  );
                })}

                {filtered.length === 0 && (
                  <li className={styles.empty}>No matching options</li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FieldError error={error} />
      {hint && !error && <p className={formStyles.hint}>{hint}</p>}
    </div>
  );
}
