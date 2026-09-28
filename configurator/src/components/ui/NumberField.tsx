// ============================================================================
// NumberField.tsx – ein Eingabefeld für Zahlen
// ----------------------------------------------------------------------------
// Hier tippt man Masse ein, zum Beispiel «900» für 900 Millimeter Höhe.
// Neben dem Feld steht die Einheit (mm), darunter ein kleiner Tipp, wie man
// richtig misst. Das Feld ist ein wiederverwendbarer Legostein: Überall, wo
// eine Zahl gebraucht wird, stecken wir genau diesen Stein hin.
// ============================================================================
import { useId } from 'react';
import { tr } from '../../i18n';

// Die Komponente NumberField – ein Zahlen-Legostein.
// Die Dinge in den geschweiften Klammern sind die «Props» – wie die Zutaten
// auf einem Rezept: Beschriftung, Einheit, aktueller Wert, was bei Änderung
// passieren soll, ein Tipp, kleinster/grösster Wert und die Schrittweite.
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
  // useId gibt uns einen einmaligen Namen, damit Beschriftung und Feld
  // zusammengehören – wie ein Namensschild an einem Geschenk.
  const id = useId();
  return (
    // 🤧 Schnupfspruch: Null, eis und zwänzg drbi –
    //    e Prise Schnupf, und s'Mass stimmt fii.
    <div className="number-field">
      <label htmlFor={id}>{tr(label)}</label>
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
            // Wenn jemand tippt: Ist das Feld leer, merken wir uns «null» (nichts),
            // sonst verwandeln wir den Text in eine richtige Zahl.
            const raw = event.target.value;
            onChange(raw === '' ? null : Number(raw));
          }}
        />
        <span className="unit">{unit}</span>
      </div>
      {/* Den Tipp zeigen wir nur, wenn es auch einen gibt. */}
      {hint && <p className="field-hint">{tr(hint)}</p>}
    </div>
  );
}
// 🤧 Schnupfspruch: Mäss zweimal, schnid eimal,
//    und schnupf dezwüsche allemal.
