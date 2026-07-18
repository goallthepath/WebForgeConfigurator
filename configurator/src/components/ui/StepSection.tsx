import type { ReactNode } from 'react';

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
    <section
      className={`step-section${unlocked ? '' : ' locked'}${done ? ' done' : ''}`}
      aria-disabled={!unlocked}
    >
      <h2 className="step-title">
        <span className="step-number" aria-hidden="true">
          {done ? '✓' : number}
        </span>
        {title}
      </h2>
      {hint && <p className="step-hint">{hint}</p>}
      {unlocked ? (
        <div className="step-body">{children}</div>
      ) : (
        <p className="step-locked-note">
          Wird freigeschaltet, sobald der vorherige Schritt beantwortet ist.
        </p>
      )}
    </section>
  );
}
