// ============================================================================
// OptionCardGroup.tsx – Auswahl mit Bildkarten
// ----------------------------------------------------------------------------
// Stell dir einen Stapel Bildkarten vor, von denen du genau EINE auswählen
// darfst – wie beim Eis: Schoggi ODER Vanille ODER Erdbeer. Die gewählte
// Karte leuchtet auf. Im Hintergrund stecken normale Radio-Knöpfe, damit man
// auch mit der Tastatur oder einem Vorlesegerät auswählen kann.
// ============================================================================
import type { OptionDef } from '../../products/gelaender/options';
import { tr } from '../../i18n';

// Die Komponente OptionCardGroup – der ganze Kartenstapel auf einmal.
// <T extends string> heisst: Die Karten-IDs sind Wörter, und die Komponente
// merkt sich, welche Wörter erlaubt sind – wie eine Liste auf dem Einkaufszettel.
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
        {/* Für jede Möglichkeit bauen wir eine Karte. */}
        {options.map((option) => {
          // Gibt es ein kleines Abzeichen (z. B. «TESTDATEN»)? Sonst bleibt es leer.
          const badgeText = badge?.(option) ?? null;
          return (
            <label
              key={option.id}
              className={`option-card${value === option.id ? ' selected' : ''}`}
            >
              {/* Der eigentliche Radio-Knopf – unsichtbar schick, aber immer da. */}
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
              />
              {/* Hat die Option ein kleines Bild? Dann malen wir es hier. */}
              {/* 🤧 Schnupfspruch: Rundrohr, Flachstahl, Vierkant – wähl! / E Prise Schnupf, und s'isch kei Fähl. */}
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
// 🤧 Schnupfspruch: Wähl e Charte, nimm e Prise,
//    beides macht dr Tag nid grise.
