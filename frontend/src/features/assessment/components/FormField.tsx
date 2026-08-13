import { clsx } from "clsx";
import type { ReactNode } from "react";

import { soundService } from "@/services/ui/soundService";
import styles from "./FormField.module.css";

/* ------------------------------------------------------------------ */
/*  FieldError                                                         */
/* ------------------------------------------------------------------ */

interface FieldErrorProps {
  error?: string;
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  return <p className={styles.error} role="alert">{error}</p>;
}

/* ------------------------------------------------------------------ */
/*  NumberField                                                        */
/* ------------------------------------------------------------------ */

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  hint?: string;
  /** e.g. "Range: 40–187.5 cm" shown at the bottom of the field. */
  range?: string;
  /** e.g. "Typical value: 33.5 years" — a dataset-average suggestion. */
  suggestion?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  ariaDescribedBy?: string;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  suffix,
  min,
  max,
  step,
  error,
  hint,
  range,
  suggestion,
  readOnly,
  autoFocus,
  ariaDescribedBy,
}: NumberFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div
        className={clsx(styles.inputWrap, error && styles.inputWrapError)}
      >
        <input
          id={id}
          className={clsx(styles.input, readOnly && styles.inputReadOnly)}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value || ""}
          placeholder={placeholder}
          readOnly={readOnly}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      <p className={styles.suggestion}>{suggestion}</p>
      <FieldError error={error} />
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {range && !error && <p className={styles.range}>{range}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AutoValueField — computed read-only value with a status chip       */
/* ------------------------------------------------------------------ */

interface AutoValueFieldProps {
  label: string;
  value: string;
  suffix?: string;
  status: ReactNode;
  hint?: string;
}

export function AutoValueField({
  label,
  value,
  suffix,
  status,
  hint,
}: AutoValueFieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.inputWrap}>
        <div className={clsx(styles.input, styles.autoValue)}>
          <span>{value}</span>
          {suffix && <span className={styles.suffix}>{suffix}</span>}
        </div>
      </div>
      <div className={styles.autoStatus}>{status}</div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SelectField                                                        */
/* ------------------------------------------------------------------ */

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  error,
  hint,
}: SelectFieldProps) {
  return (
    <div className={styles.field} data-sound-handled>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={clsx(styles.inputWrap, error && styles.inputWrapError)}>
        <select
          id={id}
          className={clsx(styles.input, styles.select)}
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            soundService.play("tick");
            onChange(e.target.value);
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <FieldError error={error} />
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SegmentField — segmented toggle control                            */
/* ------------------------------------------------------------------ */

interface SegmentFieldProps {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
}

export function SegmentField({
  id,
  label,
  value,
  options,
  onChange,
  error,
}: SegmentFieldProps) {
  return (
    <div className={styles.field} data-sound-handled>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <div
        className={styles.segment}
        role="group"
        aria-labelledby={`${id}-label`}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={clsx(
              styles.segmentButton,
              value === option && styles.segmentActive,
            )}
            aria-pressed={value === option}
            onClick={() => {
              soundService.play("tick");
              onChange(option);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      <FieldError error={error} />
    </div>
  );
}
