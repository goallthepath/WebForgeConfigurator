// Diese Datei ist der Taschenrechner fürs Gartentor.
// Sie nimmt die Antworten aus dem Formular (types.ts) und rechnet aus:
// Wie breit wird jeder Flügel? Wie viele Stäbe? Wie viele Scharniere?
// Und am Schluss schreibt sie einen Einkaufszettel mit allen Eisenteilen.
import type { GartentorDerived, GartentorInputs } from './types';
import {
  GARTENTOR_RULES_V0,
  type GartentorRuleParams,
} from '../../rules/gartentor-rules';
import { fuellstabAnzahl, type MaterialPosition } from '../gelaender/derive';
import { tr } from '../../i18n';

// deriveGartentor: Stell dir vor, du baust ein Tor aus Lego. Bevor du anfängst,
// zählst du ab, wie viele Steine du brauchst. Genau das macht diese Funktion.
/**
 * Abgeleitete Werte Gartentor (reine Funktionen, provisorisch bis zur
 * fachlichen Freigabe; Server rechnet beim Absenden erneut).
 */
export function deriveGartentor(
  inputs: GartentorInputs,
  stabBreiteMm: number,
  params: GartentorRuleParams = GARTENTOR_RULES_V0
): GartentorDerived {
  // Zuerst holen wir Breite und Höhe. Ist noch nichts eingetragen, nehmen wir 0.
  const oeffnung = inputs.oeffnungBreiteMm ?? 0;
  const hoehe = inputs.hoeheMm ?? 0;

  // Jetzt die Flügelbreite. Ein Tor darf nicht ganz genau in die Öffnung passen,
  // sonst klemmt es wie eine Schublade, die zu voll ist. Darum lassen wir
  // kleine Spalten frei: bei einem Flügel links und rechts (also 2 Spalten).
  // 🤧 Schnupfspruch: Lueg, dä Spalt isch nöd vergässe –
  //    susch hät s Tor de Pfoste gfrässe!
  let fluegelBreitenMm: number[] = [];
  if (oeffnung > 0 && inputs.fluegelart) {
    if (inputs.fluegelart === 'ein') {
      fluegelBreitenMm = [Math.max(0, oeffnung - 2 * params.spaltMm)];
    } else {
      // Zweiflügelig: symmetrische Teilung, drei Spalte (2 seitlich, 1 Mitte).
      const nutz = Math.max(0, oeffnung - 3 * params.spaltMm);
      fluegelBreitenMm = [Math.round(nutz / 2), Math.round(nutz / 2)];
    }
  }

  // Wie viele Stäbe passen in einen Flügel? Nur bei Staketen und geschmiedeter
  // Füllung gibt es Stäbe. Die Lücken dürfen nicht zu gross sein, damit
  // kein Kinderkopf und kein Hund durchpasst. Ein Blech hat keine Stäbe (0).
  const staebeProFluegel =
    inputs.fuellung === 'staketen' || inputs.fuellung === 'geschmiedet'
      ? fuellstabAnzahl(
          fluegelBreitenMm[0] ?? 0,
          stabBreiteMm,
          params.maxStabLichtMm
        )
      : 0;

  // Scharniere (Bänder): Ein kleines Tor hält gut mit 2 Scharnieren,
  // ein hohes, schweres Tor bekommt 3 – wie eine grosse Schranktür.
  const baenderProFluegel =
    hoehe > params.drittesBandAbHoeheMm ? 3 : 2;

  // Alles zusammen in ein Päckli packen und zurückgeben.
  // Neue Pfosten gibt es nur, wenn keine Mauer da ist (dann 2, sonst 0).
  return {
    fluegelBreitenMm,
    staebeProFluegel,
    baenderProFluegel,
    pfostenAnzahl: inputs.seitenbau === 'pfosten' ? 2 : 0,
  };
}

// torMaterialAuszug: Der Einkaufszettel für den Schmied.
// Er listet jedes Eisenstück auf – wie ein Rezept, das sagt:
// «2 waagrechte Rohre, 2 senkrechte Rohre, 8 Stäbe …».
// 🤧 Schnupfspruch: Uf em Zettel stoht s ganz Tor,
//    Stück für Stück – dänn gaht s im Schmied nüt verlore!
export function torMaterialAuszug(
  inputs: GartentorInputs,
  derived: GartentorDerived
): MaterialPosition[] {
  // Kein Flügel oder keine Höhe? Dann gibt es auch nichts einzukaufen.
  if (derived.fluegelBreitenMm.length === 0 || !inputs.hoeheMm) return [];
  // Die Flügel stehen nicht auf dem Boden, sie schweben ein bisschen darüber
  // (Bodenfreiheit). Darum ist der Flügel etwas weniger hoch als das ganze Tor.
  const h = inputs.hoeheMm - inputs.bodenfreiheitMm;
  const positionen: MaterialPosition[] = [];
  // Für jeden Flügel: 2 waagrechte Rahmenstücke (oben und unten)
  // und 2 senkrechte (links und rechts) – wie ein Bilderrahmen.
  derived.fluegelBreitenMm.forEach((breite, i) => {
    const name =
      derived.fluegelBreitenMm.length > 1
        ? tr('Flügel {n}', { n: i + 1 })
        : tr('Torflügel');
    positionen.push(
      { bezeichnung: tr('{name} Rahmen horizontal', { name }), anzahl: 2, laengeMm: breite },
      { bezeichnung: tr('{name} Rahmen vertikal', { name }), anzahl: 2, laengeMm: h }
    );
    if (derived.staebeProFluegel > 0) {
      positionen.push({
        bezeichnung: tr('{name} Füllstäbe', { name }),
        anzahl: derived.staebeProFluegel,
        laengeMm: null,
      });
    }
  });
  // Torpfosten werden 600 mm tief im Boden einbetoniert,
  // wie ein Zaunpfahl, damit sie nicht umkippen. Darum sind sie länger.
  if (derived.pfostenAnzahl > 0 && inputs.hoeheMm) {
    positionen.push({
      bezeichnung: tr('Torpfosten (inkl. Einbindung)'),
      anzahl: derived.pfostenAnzahl,
      laengeMm: inputs.hoeheMm + 600,
    });
  }
  // Scharniere: pro Flügel so viele, wie oben ausgerechnet, mal Anzahl Flügel.
  positionen.push({
    bezeichnung: tr('Bänder'),
    anzahl: derived.baenderProFluegel * derived.fluegelBreitenMm.length,
    laengeMm: null,
  });
  // Ganz zum Schluss das Schloss (oder der Riegel), falls gewünscht.
  // 🤧 Schnupfspruch: Schloss mit Drücker, Riegel mit Schwung –
  //    de Fuchs blibt dusse, und s Hüehnli blibt jung.
  if (inputs.schloss && inputs.schloss !== 'ohne') {
    positionen.push({
      bezeichnung:
        inputs.schloss === 'schloss-druecker'
          ? tr('Einsteckschloss mit Drücker')
          : tr('Überwurf/Riegel'),
      anzahl: 1,
      laengeMm: null,
    });
  }
  return positionen;
}
