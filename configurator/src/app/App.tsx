import { Link, Route, Routes } from 'react-router-dom';
import { ProductSelection } from '../components/ProductSelection';
import { GelaenderConfigurator } from '../products/gelaender/GelaenderConfigurator';
import { FenstergitterConfigurator } from '../products/fenstergitter/FenstergitterConfigurator';
import { GartentorConfigurator } from '../products/gartentor/GartentorConfigurator';
import { TreppeConfigurator } from '../products/treppe/TreppeConfigurator';

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
          <Route path="/gartentor/" element={<GartentorConfigurator />} />
          <Route path="/fenstergitter/" element={<FenstergitterConfigurator />} />
          <Route path="/treppe/" element={<TreppeConfigurator />} />
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
