// ============================================================================
// main.tsx – der Startknopf
// ----------------------------------------------------------------------------
// Das ist die allererste Datei, die der Browser ausführt – wie der Zündschlüssel
// beim Auto. Sie holt das Haupthaus (App), legt die Sprach-Kiste (LangProvider)
// und den Wegweiser (Router) darum herum und stellt alles in das leere Kästchen
// mit der ID «root» in der index.html.
// ============================================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from '../i18n';
import { applyDesignTokens } from './tokens';
import './styles.css';

// Zuerst malen wir die Hausfarben an die Wand: Farben, Schriften und Abstände
// kommen aus einer gemeinsamen Farbpalette (siehe tokens.ts).
applyDesignTokens();

// Hier entscheiden wir, welche Art Wegweiser wir brauchen:
// - «embedded» (eingebettet) = Wir wohnen als Gast in einer anderen Webseite.
//   Dann schreiben wir den Weg hinter ein #-Zeichen, wie eine Notiz am Rand.
// - sonst = Wir haben ein eigenes Haus mit schönen, echten Adressen.
// Eingebettet (WordPress-Shortcode, iframe) läuft der Konfigurator aus einem
// beliebigen Plugin-Verzeichnis – dort gibt es keine Server-Rewrites, darum
// Hash-Routing (…/index.html#/gelaender/). Eigenständig unter /konfigurator/
// bleiben saubere Pfade.
const embedded = import.meta.env.MODE === 'embed';
const Router = embedded ? HashRouter : BrowserRouter;

// Jetzt stecken wir die Legosteine ineinander wie russische Puppen (Matroschkas):
// StrictMode (ein strenger Aufpasser, der Fehler früh meldet)
//   → LangProvider (die Sprach-Kiste, aus der alle die Sprache holen)
//     → Router (der Wegweiser)
//       → App (das eigentliche Haus).
// 🤧 Schnupfspruch: Es Div, es Root, e Script drzue –
//    e Prise Schnupf, dänn hät mer Rueh.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <Router basename={embedded ? undefined : '/konfigurator'}>
        {/* Das Haupthaus kommt ganz nach innen – es kann nun Sprache und Wegweiser benutzen. */}
        <App />
      </Router>
    </LangProvider>
  </React.StrictMode>,
);
// 🤧 Schnupfspruch: StrictMode luegt, dass nüt verbricht,
//    dr Schnupf luegt, dass mer's Lache nid vergisst.
