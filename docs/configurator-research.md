# Konfigurator-Recherche (Markt- und UX-Referenzen)

Stand: 2026-07-18. Zweck: UX-Orientierung für die drei WebForge-Module.
**Wichtig:** Preise, Masse und technische Werte anderer Anbieter sind
Marktbeobachtung — sie werden NIE als WebForge-Daten übernommen
(Freigabe bleibt Gate C, siehe ADR-002/003).

## metallbauXpress.ch (Amboss AG, Neuheim ZG) — Hauptreferenz des Auftraggebers

Selbst durchgeklickt am Beispiel «Staketengeländer Xpress»
(gelaenderxpress.ch leitet per 301 auf dieselbe Plattform um).

### Ablauf (ein langes Formular mit progressiver Einblendung)

```text
1. Variante        I | L innen | L aussen | U innen | U aussen | «Eigene»
2. Situation       Wand links/rechts/beidseitig/keine
3. Befestigung     Beton oben | Beton Seite | Beton Seite mit Abstand |
                   Beton Attika | Holz Seite | Granit-Quaderstein |
                   Flachdach mit Gegengewicht (ohne Bohren)
4. Längen eingeben
5. Geländer wählen
6. Oberfläche wählen
7. Werkzeug (Zubehör)
Abschluss          Total CHF inkl. MwSt. · Stückzahl · In den Warenkorb ·
                   Konfiguration speichern
```

### Beobachtete UX-Muster (übernehmenswert)

- **Bildkarten statt Dropdowns:** Jede Option ist eine Radiokarte mit
  Piktogramm, Tooltip («Du stehst im L») und Bild-Zoom.
- **Progressive Einblendung:** Der nächste Schritt erscheint erst nach der
  Wahl — kein leeres Riesenformular; Schrittleiste oben als Orientierung.
- **Messhilfe im Kontext:** «Du misst bis zur Wand, wir ziehen nachträglich
  5 cm Abstand ab» — die Regel steht direkt bei der Option.
- **Escape-Hatch:** Variante «Eigene» (mehr als zwei Ecken / nicht 90°)
  führt aus dem Standardpfad heraus → entspricht exakt unserem
  «Individuelle Ausführung anfragen».
- **Sehr konkrete Befestigungssituationen** statt abstrakter Begriffe
  (Granit-Quaderstein, Attika, Blech auf Beton) — reduziert Rückfragen.
- **Vertrauenselemente neben dem Konfigurator:** Montageanleitung,
  «Gratis Ausmessbox», Galerie, Kundenstimmen und ein persönlicher
  Ansprechpartner mit Foto/Telefon («Sali! Ich bin Christian») —
  Vorbild für einen Meister-Block.
- **Konfiguration speichern** als eigener Button neben dem Warenkorb.
- Bestellung verspricht eine **detaillierte Zeichnung der Situation**
  zur Endkontrolle → Pendant: unsere PDF-Zusammenfassung mit Masszeichnung.
- Preisanker auf der Übersichtsseite («Ab 192 CHF/m», «Ab 433 CHF/m»)
  schaffen Erwartungsklarheit vor dem Einstieg.

### Bewusste Unterschiede zu WebForge

| metallbauXpress | WebForge (verbindlich) |
| --- | --- |
| Bausatz-Verkauf, Warenkorb, Kasse | **Offertanfrage**, persönliche Prüfung durch den Meister |
| Selbstmontage im Fokus | Selbstmontage ODER Montage durch WebForge |
| Exakter Kaufpreis inkl. MwSt. | Richtpreis/Preisspanne, serverseitig geprüft |
| Kein 3D | 3D-Vorschau (R3F) + 2D-Fallback |
| Standard-Sortiment | Kunstschlosserei-Qualität, Übergang zu Individualanfertigung |

## Kordo (kordodesign.com)

2D-Grundriss zeichnen → automatische 3D-Visualisierung → Artikelliste mit
Kostenberechnung → Angebot. Interessant als Zielbild für L-förmige Geländer
(Segmentzeichnung), für Release 1 aber bewusst zu komplex — wir bleiben beim
Schrittassistenten mit Längenfeldern pro Segment.

## Weitere Marktbeobachtungen

- **K3 (k3-konfigurator.de):** B2B-Konfigurator-Software für Metallbauer;
  bestätigt den Trend, Konfiguration + Visualisierung + Anfrage zu koppeln.
- **LUGINBÜHL (metall-glasbau.ch):** kommuniziert offene Richtpreise
  (z. B. Attikageländer 500–550 CHF/m) — Beleg, dass Richtpreise pro
  Laufmeter im Schweizer Markt üblich und akzeptiert sind.
  ⚠ Marktbeobachtung, NICHT als WebForge-Preis verwenden.

## Vertiefung Geländer (Produktseiten-Analyse, 2026-07-18)

**metallbauXpress Staketengeländer Classic:** Edelstahlhandlauf Ø 42.4,
T-Stahl-Pfosten 60×60×7, Rechteckrohr-Füllung 40×20×2, Flachstahl 30×6,
max. Pfostenabstand 1.2 m, Höhe 1.02 m, «statisch geprüft nach SIA 261/358»,
max. 12 cm Öffnungen (Kindersicherheit), 120 kg/m Horizontallast,
ab 253 CHF/m, feuerverzinkt oder Duplex-Pulverbeschichtung.

**metallbauXpress Glasgeländer Pure:** VSG12-2 werkseitig in Rahmenleisten
verklebt, klar oder satiniert, nur Seitenmontage, T-Stahl 50×50×5,
max. Pfostenabstand 1.0 m, **ohne Handlauf** (puristisch), ab 433 CHF/m.

**Deutsche Konfiguratoren** (meingelaender.de, Geländer-Manufaktur,
Cosch, gelaender-inox.de u. a.): etabliertes Optionsvokabular —
Füllungen Staketen / «Reling» (Querstab) / Glas (klar, matt, farbig);
Handlauf-Endstücke gerade oder gewölbte Kappe, **Kugel**, **90°-Endbogen**.

⚠ Alle Zahlen sind Marktbeobachtung. Sie belegen, dass unsere
TESTDATEN-Platzhalter plausibel liegen, ersetzen aber keine Freigabe
(Gate C) — insbesondere Normwerte werden nie ungeprüft übernommen.

## Optimierung für den Meister (Werkstatt-Sicht, Backlog)

1. **Materialauszug** aus jeder Konfiguration (Pfosten, Zuschnitte,
   Stückzahlen) — im Modul bereits als provisorische Tabelle umgesetzt;
   später Teil von PDF/Backend und Basis der Stückliste.
2. Anfrage im Backend mit 3D-Vorschaubild + abgewickelter Masszeichnung
   öffnen (Phase 3/6).
3. Sicherheitsstufe (Grün/Gelb/Rot) prominent in der Anfrageliste —
   Priorisierung der Fachprüfung.
4. Kunde liefert Fotos direkt im Abschluss-Schritt (Upload, Phase 3) —
   weniger Rückfragen vor dem Aufmass.
5. Konfigurations-Link in beiden Richtungen: der Meister kann eine korrigierte
   Variante an den Kunden zurückschicken (bereits möglich).
6. Später: «Aufmass-Service» als Option analog Ausmessbox (P2, mit
   dem Meister besprechen).

## Konsequenzen für unsere Module

1. Schrittassistent mit Bildkarten-Optionen + Tooltips (alle drei Module).
2. Variantenwahl Geländer: I / L innen / L aussen — «mehr Ecken» →
   Button «Individuelle Ausführung anfragen» (kein Rot-Frust, sondern Weg).
3. Befestigungs-/Untergrundschritt mit konkreten Schweizer Situationen;
   Formulierungen mit dem Meister fachlich validieren (Gate C).
4. Messhilfen als Inline-Hinweise direkt bei den Feldern, plus Skizze.
5. Preisdarstellung: «ab»-Anker erst, wenn eine Preisversion freigegeben
   ist; bis dahin ehrliche «Individuelle Prüfung».
6. Persönlicher Block des Meisters neben dem Konfigurator (Foto, Telefon).
7. «Konfiguration speichern» prominent als gleichwertige Aktion.
8. PDF mit Masszeichnung als Gegenstück zur «detaillierten Zeichnung».
9. Idee für später (P2+, mit dem Meister besprechen): «Ausmessbox»- oder
   Aufmass-Service-Angebot als Anfrageoption.
