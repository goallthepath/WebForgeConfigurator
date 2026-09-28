import { Link } from 'react-router-dom';
import { PRODUCT_MODULES } from '../products/catalog';
import { tr } from '../i18n';

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
      <div className="product-grid">
        {PRODUCT_MODULES.map((module) => (
          <Link key={module.id} to={module.route} className="product-card">
            <h2>{tr(module.title)}</h2>
            <p>{tr(module.description)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
