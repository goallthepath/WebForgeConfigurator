import { Link, Route, Routes } from 'react-router-dom';
import { ProductSelection } from '../components/ProductSelection';
import { ModulePage } from '../components/ModulePage';
import { GelaenderConfigurator } from '../products/gelaender/GelaenderConfigurator';

export default function App() {
  return (
    <>
      <header className="app-header">
        <Link to="/">Musterschlosserei – Konfigurator</Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProductSelection />} />
          <Route path="/gelaender/" element={<GelaenderConfigurator />} />
          <Route path="/gartentor/" element={<ModulePage productId="gartentor" />} />
          <Route
            path="/fenstergitter/"
            element={<ModulePage productId="fenstergitter" />}
          />
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
