import { useId } from 'react';

/** Zahlenfeld mit Einheit und Inline-Messhilfe. */
export function NumberField({
  label,
  unit,
  value,
  onChange,
  hint,
  min,
  max,
  step = 10,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (next: number | null) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const id = useId();
  return (
    <div className="number-field">
      <label htmlFor={id}>{label}</label>
      <div className="number-input">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === '' ? null : Number(raw));
          }}
        />
        <span className="unit">{unit}</span>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
