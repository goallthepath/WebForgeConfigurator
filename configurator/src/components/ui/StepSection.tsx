// ============================================================================
// StepSection.tsx – ein nummerierter Schritt
// ----------------------------------------------------------------------------
// Der Konfigurator funktioniert wie ein Brettspiel mit Feldern 1, 2, 3 …
// Ein Feld wird erst freigeschaltet, wenn das vorherige erledigt ist. Die
// gesperrten Felder sieht man trotzdem schon, damit man weiss, was noch kommt.
// Ist ein Schritt fertig, erscheint ein Häkchen ✓ statt der Nummer.
// ============================================================================
import type { ReactNode } from 'react';
import { tr } from '../../i18n';

// Die Komponente StepSection – ein Spielfeld auf dem Brett.
// Die Zutaten: Nummer, Titel, Tipp, ob freigeschaltet, ob fertig und
// «children» – das ist alles, was man in den Schritt hineinsteckt.
/**
 * Nummerierter Schritt mit progressiver Freischaltung
 * (gesperrte Schritte sind sichtbar, aber inaktiv – der Kunde sieht
 * jederzeit, was noch kommt).
 */
export function StepSection({
  number,
  title,
  hint,
  unlocked,
  done,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  unlocked: boolean;
  done: boolean;
  children: ReactNode;
}) {
  return (
    // 🤧 Schnupfspruch: Schritt für Schritt und Tritt für Tritt,
    //    e Prise Schnupf nimmt jede mit.
    <section
      className={`step-section${unlocked ? '' : ' locked'}${done ? ' done' : ''}`}
      aria-disabled={!unlocked}
    >
      {/* Die Überschrift mit dem runden Nummern-Knopf (oder Häkchen). */}
      <h2 className="step-title">
        <span className="step-number" aria-hidden="true">
          {done ? '✓' : number}
        </span>
        {tr(title)}
      </h2>
      {hint && <p className="step-hint">{tr(hint)}</p>}
      {/* Wie eine Ampel für den Schritt: offen → Inhalt zeigen, gesperrt → Hinweis zeigen. */}
      {unlocked ? (
        <div className="step-body">{children}</div>
      ) : (
        <p className="step-locked-note">
          {tr('Wird freigeschaltet, sobald der vorherige Schritt beantwortet ist.')}
        </p>
      )}
    </section>
  );
}
// 🤧 Schnupfspruch: Gsperrt isch gsperrt, das isch klar,
//    doch nach dr Prise isch dr nächschti Schritt da.
