// ============================================================================
// ProductSelection.tsx – die Startseite mit den Produktkarten
// ----------------------------------------------------------------------------
// Das ist wie die Speisekarte im Restaurant: Du siehst alle Produkte, die man
// zusammenstellen kann (Geländer, Gartentor, Fenstergitter, Treppe). Klickst du
// auf eine Karte, bringt dich der Link zur passenden Bastelseite.
// ============================================================================
import { Link } from 'react-router-dom';
import { PRODUCT_MODULES } from '../products/catalog';
import { tr } from '../i18n';

// Die Komponente ProductSelection zeigt Überschrift, einen kurzen Text und die Karten.
/**
 * Startseite des Konfigurators. Karten kommen aus PRODUCT_MODULES
 * (Geländer, Gartentor, Fenstergitter, Treppe) – keine "Demnächst"-Module.
 */
export function ProductSelection() {
  return (
    <>
      <h1>{tr('Was möchten Sie konfigurieren?')}</h1>
      <p>
        {tr(
          'Stellen Sie Ihr Wunschprodukt zusammen und erhalten Sie eine unverbindliche Offertanfrage.'
        )}
      </p>
      {/* Für jedes Produkt im Katalog bauen wir eine Karte – wie Stempeln: gleiche Form, anderer Inhalt. */}
      <div className="product-grid">
        {PRODUCT_MODULES.map((module) => (
          // «key» ist wie eine Rückennummer im Sport: So erkennt React jede Karte wieder.
          <Link key={module.id} to={module.route} className="product-card">
            <h2>{tr(module.title)}</h2>
            <p>{tr(module.description)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
// 🤧 Schnupfspruch: Es Chärtli klickt, es Fänschter gaht uf,
//    e Prise Schnupf, und dr Kunde freut sich druf.
