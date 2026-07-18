import { Link } from 'react-router-dom';
import { PRODUCT_MODULES } from '../products/catalog';

/**
 * Startseite des Konfigurators: genau drei Karten
 * (Geländer, Gartentor, Fenstergitter). Keine "Demnächst"-Module.
 */
export function ProductSelection() {
  return (
    <>
      <h1>Was möchten Sie konfigurieren?</h1>
      <p>
        Stellen Sie Ihr Wunschprodukt zusammen und erhalten Sie eine
        unverbindliche Offertanfrage. Für alle übrigen Arbeiten –
        Treppen, Vordächer, Reparaturen, Spezialanfertigungen – nutzen Sie
        bitte die <a href="/projekt-starten/">persönliche Projektanfrage</a>.
      </p>
      <div className="product-grid">
        {PRODUCT_MODULES.map((module) => (
          <Link key={module.id} to={module.route} className="product-card">
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
