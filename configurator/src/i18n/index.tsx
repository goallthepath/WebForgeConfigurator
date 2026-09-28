import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { EN_COMMON } from './en/common';
import { EN_GELAENDER } from './en/gelaender';
import { EN_GARTENTOR } from './en/gartentor';
import { EN_FENSTERGITTER } from './en/fenstergitter';
import { EN_TREPPE } from './en/treppe';

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

const EN: Record<string, string> = {
  ...EN_COMMON,
  ...EN_GELAENDER,
  ...EN_GARTENTOR,
  ...EN_FENSTERGITTER,
  ...EN_TREPPE,
};

const STORAGE_KEY = 'webforge-lang';

// Modulweite Sprache, damit auch reine Funktionen (Regeln, derive) ohne
// React-Kontext übersetzen können. Tests laufen daher standardmässig auf DE.
let currentLang: Lang = 'de';

export function getLang(): Lang {
  return currentLang;
}

export function tr(de: string, vars?: Record<string, string | number>): string {
  let text = currentLang === 'en' ? (EN[de] ?? de) : de;
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.split(`{${key}}`).join(String(value));
    }
  }
  return text;
}

function initialLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
  } catch {
    // Speicher gesperrt – Standard verwenden
  }
  return 'de';
}

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({
  lang: 'de',
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    currentLang = initialLang();
    document.documentElement.lang = currentLang;
    return currentLang;
  });

  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ohne Speicher gilt die Wahl nur für diese Sitzung
    }
    setLangState(next);
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function LanguageSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Sprache / Language">
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
