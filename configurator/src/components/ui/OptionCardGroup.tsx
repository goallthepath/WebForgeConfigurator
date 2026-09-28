import type { OptionDef } from '../../products/gelaender/options';
import { tr } from '../../i18n';

/**
 * Bildkarten-Auswahl (Radiogruppe). Native Radio-Inputs bleiben im DOM –
 * dadurch vollständige Tastatur- und Screenreader-Bedienung.
 */
export function OptionCardGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  badge,
}: {
  legend: string;
  name: string;
  options: readonly OptionDef<T>[];
  value: T | null;
  onChange: (next: T) => void;
  /** Optionaler Hinweis-Badge pro Option (z. B. TESTDATEN). */
  badge?: (option: OptionDef<T>) => string | null;
}) {
  return (
    <fieldset className="option-group">
      <legend>{tr(legend)}</legend>
      <div className="option-cards">
        {options.map((option) => {
          const badgeText = badge?.(option) ?? null;
          return (
            <label
              key={option.id}
              className={`option-card${value === option.id ? ' selected' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
              />
              {option.icon && (
                <svg
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  className="option-icon"
                  dangerouslySetInnerHTML={{ __html: option.icon }}
                />
              )}
              <span className="option-label">{tr(option.label)}</span>
              <span className="option-description">{tr(option.description)}</span>
              {badgeText && <span className="option-badge">{tr(badgeText)}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
