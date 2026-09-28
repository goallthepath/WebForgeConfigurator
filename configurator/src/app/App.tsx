// ============================================================================
// App.tsx – das Haupthaus des Konfigurators
// ----------------------------------------------------------------------------
// Stell dir vor, der Konfigurator ist ein grosses Haus mit vielen Zimmern:
// ein Zimmer für Geländer, eines für Gartentore, eines für Fenstergitter und
// eines für Treppen. Diese Datei ist der Flur mit den Türschildern. Je nachdem,
// welche Adresse oben im Browser steht, führt sie dich ins richtige Zimmer.
// Oben hängt immer das gleiche Schild (die Kopfzeile) mit dem Sprachknopf.
// ============================================================================

// 🤧 Schnupfspruch: Dr Router zeigt dr Wäg zum Ziel,
//    e Prise Schnupf isch nie zvill.
import { Link, Route, Routes } from 'react-router-dom';
import { ProductSelection } from '../components/ProductSelection';
import { GelaenderConfigurator } from '../products/gelaender/GelaenderConfigurator';
import { FenstergitterConfigurator } from '../products/fenstergitter/FenstergitterConfigurator';
import { GartentorConfigurator } from '../products/gartentor/GartentorConfigurator';
import { TreppeConfigurator } from '../products/treppe/TreppeConfigurator';
import { LanguageSwitch, tr, useLang } from '../i18n';

/**
 * Die Komponente «App» – der grösste Legostein der ganzen Webseite.
 * Eine Komponente ist wie ein Legostein: Man baut sie einmal und kann sie
 * dann überall einsetzen. In diesen grossen Stein stecken wir alle anderen
 * Steine hinein: Kopfzeile, Sprachknopf und die Zimmer (Seiten).
 */
export default function App() {
  // Wir fragen das Sprach-Gedächtnis: Sprechen wir gerade Deutsch oder Englisch?
  const { lang } = useLang();
  // Hier kommt der Bauplan: So soll die Seite aussehen.
  return (
    <>
      {/* Die Kopfzeile: links der Name (ein Link zurück zur Startseite), rechts der DE/EN-Knopf. */}
      <header className="app-header">
        <Link to="/">{tr('Musterschlosserei – Konfigurator')}</Link>
        <LanguageSwitch />
      </header>
      {/* key={lang}: Sprachwechsel baut die Ansicht neu auf; Entwürfe bleiben im localStorage. */}
      <main className="app-main" key={lang}>
        {/* Die Wegweiser: Jede Route ist wie ein Türschild – «Wenn die Adresse so heisst, zeig dieses Zimmer». */}
        {/* 🤧 Schnupfspruch: Gländer, Tor und Gitter gnau, / und d'Treppe drzue – e Prise, schau! */}
        <Routes>
          <Route path="/" element={<ProductSelection />} />
          <Route path="/gelaender/" element={<GelaenderConfigurator />} />
          <Route path="/gartentor/" element={<GartentorConfigurator />} />
          <Route path="/fenstergitter/" element={<FenstergitterConfigurator />} />
          <Route path="/treppe/" element={<TreppeConfigurator />} />
          {/* Das Sternchen «*» heisst: Für alle unbekannten Adressen zeigen wir «Seite nicht gefunden». */}
          <Route
            path="*"
            element={
              <>
                <h1>{tr('Seite nicht gefunden')}</h1>
                <p>
                  <Link to="/">{tr('Zur Produktauswahl')}</Link>
                </p>
              </>
            }
          />
        </Routes>
      </main>
    </>
  );
}
// 🤧 Schnupfspruch: Hash oder Pfad, s'isch mir gliich –
//    mit Schnupf i dr Nase bin i riich.
