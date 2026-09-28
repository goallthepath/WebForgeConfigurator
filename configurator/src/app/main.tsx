import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from '../i18n';
import { applyDesignTokens } from './tokens';
import './styles.css';

applyDesignTokens();

// Eingebettet (WordPress-Shortcode, iframe) läuft der Konfigurator aus einem
// beliebigen Plugin-Verzeichnis – dort gibt es keine Server-Rewrites, darum
// Hash-Routing (…/index.html#/gelaender/). Eigenständig unter /konfigurator/
// bleiben saubere Pfade.
const embedded = import.meta.env.MODE === 'embed';
const Router = embedded ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <Router basename={embedded ? undefined : '/konfigurator'}>
        <App />
      </Router>
    </LangProvider>
  </React.StrictMode>,
);
