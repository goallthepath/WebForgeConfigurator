import { Link, Route, Routes } from 'react-router-dom';
import { ProductSelection } from '../components/ProductSelection';
import { ModulePage } from '../components/ModulePage';
import { PRODUCT_MODULES } from '../products/catalog';

export default function App() {
  return (
    <>
      <header className="app-header">
        <Link to="/">Musterschlosserei – Konfigurator</Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProductSelection />} />
          {PRODUCT_MODULES.map((module) => (
            <Route
              key={module.id}
              path={module.route}
              element={<ModulePage productId={module.id} />}
            />
          ))}
          <Route
            path="*"
            element={
              <>
                <h1>Seite nicht gefunden</h1>
                <p>
                  <Link to="/">Zur Produktauswahl</Link>
                </p>
              </>
            }
          />
        </Routes>
      </main>
    </>
  );
}
