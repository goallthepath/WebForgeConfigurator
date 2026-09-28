import { Link, Route, Routes } from 'react-router-dom';
import { ProductSelection } from '../components/ProductSelection';
import { GelaenderConfigurator } from '../products/gelaender/GelaenderConfigurator';
import { FenstergitterConfigurator } from '../products/fenstergitter/FenstergitterConfigurator';
import { GartentorConfigurator } from '../products/gartentor/GartentorConfigurator';
import { TreppeConfigurator } from '../products/treppe/TreppeConfigurator';
import { LanguageSwitch, tr, useLang } from '../i18n';

export default function App() {
  const { lang } = useLang();
  return (
    <>
      <header className="app-header">
        <Link to="/">{tr('Musterschlosserei – Konfigurator')}</Link>
        <LanguageSwitch />
      </header>
      {/* key={lang}: Sprachwechsel baut die Ansicht neu auf; Entwürfe bleiben im localStorage. */}
      <main className="app-main" key={lang}>
        <Routes>
          <Route path="/" element={<ProductSelection />} />
          <Route path="/gelaender/" element={<GelaenderConfigurator />} />
          <Route path="/gartentor/" element={<GartentorConfigurator />} />
          <Route path="/fenstergitter/" element={<FenstergitterConfigurator />} />
          <Route path="/treppe/" element={<TreppeConfigurator />} />
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
