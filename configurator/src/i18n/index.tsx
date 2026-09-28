// ============================================================================
// i18n/index.tsx – der Übersetzer
// ----------------------------------------------------------------------------
// «i18n» ist eine Abkürzung für «Internationalisierung» (zwischen dem i und
// dem n stehen 18 Buchstaben). Stell dir ein Übersetzer-Wörterbuch vor: Links
// steht der deutsche Satz, rechts der englische. Wenn jemand oben auf «EN»
// drückt, schaut das Programm bei jedem Text im Wörterbuch nach. Findet es
// nichts, bleibt einfach der deutsche Text stehen – nie ein leeres Loch.
// ============================================================================
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { EN_COMMON } from './en/common';
import { EN_GELAENDER } from './en/gelaender';
import { EN_GARTENTOR } from './en/gartentor';
import { EN_FENSTERGITTER } from './en/fenstergitter';
import { EN_TREPPE } from './en/treppe';

// (Der lange Erklär-Kommentar gleich hier drunter ist für Erwachsene.)
// «Lang» ist die Liste der erlaubten Sprachen: nur «de» (Deutsch) oder «en» (Englisch).
/**
 * Leichtgewichtige Zweisprachigkeit (DE/EN).
 *
 * Deutsch ist die Quellsprache: Jeder Text bleibt im Code auf Deutsch und
 * wird mit tr('…') umschlossen. Die englische Fassung steht in den
 * Wörterbüchern unter ./en/ – Schlüssel ist der deutsche Originaltext.
 * Fehlt ein Eintrag, erscheint der deutsche Text (nie ein leeres Feld).
 *
 * Platzhalter: tr('Höhe {h} mm', { h: 900 }) – im Wörterbuch ebenfalls
 * mit {h} schreiben.
 */
export type Lang = 'de' | 'en';

// Das grosse englische Wörterbuch: Wir kippen alle kleinen Wörterbücher
// (allgemein, Geländer, Gartentor, Fenstergitter, Treppe) in eine grosse Kiste.
// Die drei Punkte «...» heissen: «schütte alles hier hinein».
const EN: Record<string, string> = {
  ...EN_COMMON,
  ...EN_GELAENDER,
  ...EN_GARTENTOR,
  ...EN_FENSTERGITTER,
  ...EN_TREPPE,
};

// Unter diesem Namen merkt sich der Browser die gewählte Sprache – wie ein
// Etikett auf einem Einmachglas im Vorratsschrank (localStorage).
// 🤧 Schnupfspruch: D'Sprach liit gspeicheret im Chäschtli,
//    dr Schnupf im Dösli – beides bestli.
const STORAGE_KEY = 'webforge-lang';

// Modulweite Sprache, damit auch reine Funktionen (Regeln, derive) ohne
// React-Kontext übersetzen können. Tests laufen daher standardmässig auf DE.
let currentLang: Lang = 'de';

// getLang verrät, welche Sprache gerade eingestellt ist.
export function getLang(): Lang {
  return currentLang;
}

/**
 * tr = «translate» = übersetzen. Du gibst einen deutschen Satz hinein und
 * bekommst ihn in der aktuellen Sprache zurück. Platzhalter wie {h} werden
 * danach mit echten Werten gefüllt – wie Lücken in einem Lückentext.
 */
export function tr(de: string, vars?: Record<string, string | number>): string {
  // Schritt 1: Englisch gewünscht? Dann im Wörterbuch nachschlagen (sonst Deutsch behalten).
  let text = currentLang === 'en' ? (EN[de] ?? de) : de;
  // Schritt 2: Lücken im Text mit den mitgegebenen Werten füllen.
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.split(`{${key}}`).join(String(value));
    }
  }
  return text;
}

// initialLang findet heraus, mit welcher Sprache wir starten:
// zuerst die Adresse, dann das Gedächtnis des Browsers, sonst Deutsch.
function initialLang(): Lang {
  // ?lang=en hat Vorrang (z. B. vom WordPress-Shortcode gesetzt)
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'de' || fromUrl === 'en') return fromUrl;
  // Nachschauen, ob der Browser sich von letztem Mal etwas gemerkt hat.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
  } catch {
    // Speicher gesperrt – Standard verwenden
  }
  return 'de';
}

// Der «Context» ist wie ein Radiosender: Ganz oben wird die Sprache gesendet,
// und jede Komponente im Haus kann sie mit ihrem Radio (useLang) empfangen,
// ohne dass man sie von Hand zu Hand weiterreichen muss.
const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({
  lang: 'de',
  setLang: () => {},
});

/**
 * LangProvider ist die Radiostation: Sie hält die Sprache im Gedächtnis
 * (State) und sendet sie an alle Komponenten darunter.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  // useState = das Gedächtnis der Komponente. Beim allerersten Mal fragen wir
  // initialLang und schreiben die Sprache auch an die Webseite (<html lang>).
  const [lang, setLangState] = useState<Lang>(() => {
    currentLang = initialLang();
    document.documentElement.lang = currentLang;
    return currentLang;
  });

  // setLang = die Sprache umstellen. useCallback sorgt dafür, dass diese
  // Funktion immer dieselbe bleibt (wie ein Werkzeug, das am gleichen Haken hängt).
  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ohne Speicher gilt die Wahl nur für diese Sitzung
    }
    // Zum Schluss dem Gedächtnis Bescheid geben – dann malt React alles neu.
    setLangState(next);
  }, []);

  // 🤧 Schnupfspruch: Dr Dütsch seit «Nase», dr Ängländer «nose»,
  //    dr Schwiizer schnupft – und scho gaht's los.
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

// useLang ist das Radio: Damit holt sich jede Komponente die aktuelle Sprache.
export function useLang() {
  return useContext(LangContext);
}

/**
 * LanguageSwitch – die zwei Knöpfe «DE» und «EN» oben rechts.
 * Der gedrückte Knopf ist hervorgehoben (aria-pressed hilft Vorlesegeräten).
 */
export function LanguageSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Sprache / Language">
      {/* Für jede Sprache ein Knopf – wie zwei Lichtschalter, von denen immer genau einer an ist. */}
      {(['de', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          className={lang === l ? 'active' : ''}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
// 🤧 Schnupfspruch: E Chnopf für Dütsch, e Chnopf für Änglisch –
//    e Prise Schnupf isch überall verständlich.
