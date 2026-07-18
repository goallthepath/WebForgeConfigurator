# Änderungsverlauf

Alle nennenswerten Änderungen an der WebForge-Plattform werden hier dokumentiert.

## [Unreleased]

### Treppen-Modul: Treppe & Treppengeländer kombiniert (2026-07-18)

- Viertes Produktmodul auf Kundenwunsch: `/konfigurator/treppe/` mit drei
  Modi — **nur Treppe**, **nur Treppengeländer** (Bestandstreppe wird
  grau-transparent dargestellt) oder **kombiniert**.
- Steigungsrechnung nach Schrittmassregel (2×Steigung + Auftritt ≈ 630 mm):
  automatische Steigungszahl aus der Geschosshöhe, Live-Anzeige von
  Steigung/Auftritt/Schrittmass/Lauflänge/Neigung, manuelle
  Stufenzahl-Übersteuerung; Grenzwerte TESTDATEN, ROT bei Steigung
  ausserhalb, Podest-Hinweis über der Maximalhöhe (→ individuelle Anfrage
  für gewendelte/mehrläufige Treppen).
- Treppe: Wangenkonstruktion (neue Katalogrolle `wange`, Flachstahl-
  Profile inkl. Edelstahl), Stufentypen Gitterrost (durchsichtige
  Rost-Textur), Tränenblech, Glattblech (aussen mit Rutsch-Hinweis).
- Treppengeländer: Seite links/rechts/beidseitig, Höhe mit
  BFU-Richtwert ≥900 mm im Lauf (ROT darunter), Füllungen
  Staketen/Querstab (schräg mitlaufend)/Charakter mit Ornamenten,
  Profile aus dem Katalog (Treppen-Freigaben gespiegelt),
  Handlauf-Abschlüsse; Handlauf und Gurte laufen der Schrägen entlang
  (frei geneigte 3D-Stäbe).
- 2D-**Treppenschnitt** (Seitenansicht mit Stufenlinie, Wange, Geländer
  und Massketten) als Fallback und PDF-Basis.
- Katalog 0.0.4-TESTDATEN (33 Profile); Schema um Produkt `treppe` und
  Rolle `wange` erweitert; Geländer-Modul verlinkt Treppengeländer neu
  direkt auf das Treppen-Modul.
- Tests auf 83 erweitert (Schrittmassregel, Modi, Schräggeometrie,
  BFU-Treppenlauf, Podest-/Steigungsgrenzen).

### Fenstergitter- und Gartentor-Module (2026-07-18)

- Gemeinsame 3D-Bausteine extrahiert (`viewer/scene-shared.tsx`):
  ShapeMesh, Muster-/Holztexturen, Ornamente, Masslinien, CameraRig.
- **Fenstergitter (GRID-001…004):** Innen/Aussen, Fluchtweg-Sicherheits-
  frage (ja ⇒ ROT + individuelle Anfrage), Montage in Leibung oder vor
  der Fassade, Leibungs-Lichtmass/Aussenmass mit automatischer
  Mass-Ableitung (Spiel/Überstand TESTDATEN), symmetrische Stabteilung,
  Quergurte (1–2), Zierelemente (Ringe/Voluten/Körbe mit Lage),
  Material-/Profil-/Oberflächenwahl, Wunschmass-Stab, Laschen-Ableitung
  (2–3 je Seite) — 3D mit Wand, Fensteröffnung, Glas und Laschen inkl.
  Anker; 2D-Zeichnung; eigener Autosave/Share-Link.
- **Gartentor (GATE-001…004):** ein-/zweiflügelig, bestehende Mauer oder
  neue Torpfosten, Öffnungsrichtung, Anschlagseite, lichte Öffnung/Höhe/
  Bodenfreiheit, Flügelteilung mit Spalten (TESTDATEN), Füllungen
  Staketen/Blech (voll/loch/laser mit Motiven)/Charakter (Ornamente),
  Schloss/Riegel/ohne, Antriebs-Vorbereitung als Anfrageoption,
  Bänder-Ableitung (2–3 je Flügel), Torpfosten-Profil — 3D mit
  **Öffnungs-Simulation (Slider 0–95°)**, Bändern, Schloss und Drücker;
  2D-Zeichnung; eigener Autosave/Share-Link.
- Produktkatalog: Gartentor-Freigaben für Edelstahl-Profile ergänzt.
- Platzhalter-Modulseiten entfernt; alle drei Routen führen zu echten
  Konfiguratoren.
- Tests auf 71 erweitert (je 10 für Fenstergitter und Gartentor:
  Massableitung, Teilungen, Laschen/Bänder, Fluchtweg-Rot,
  Flügelgeometrie, Materialauszug).

### Geländer-Modul: Befestigungsmasse, Auto-Obergurt, Ornament-Design (2026-07-18, fünfter Ausbau)

- Befestigungs-Wunschmasse für JEDE Montageart: Fussplatte (L×B×D),
  Schwert (H×B×D), Kragarm (Auskragung×Stärke), Einbindetiefe
  (eingelassen) und Wandlaschen (H×B×D) — mit TESTDATEN-Vorschau-
  bereichen, Ankerbild in 3D und Position im Materialauszug.
- Obergurt-Logik konstruktiv korrekt: aufgesetzter Handlauf erzeugt
  AUTOMATISCH einen Obergurt (Rahmenbauweise, Höhe einstellbar);
  Handlauf «zwischen» den Pfosten übernimmt selbst die Obergurt-
  Funktion. Handlauf-Position dafür in den Konstruktions-Block verschoben.
- Unter-/Knieleisten-Gurte für ALLE Füllungsarten (auch Reling/Glas);
  Querstab-Lagen rechnen zwischen Unter- und Obergurt.
- Neuer Standard-Abschluss «1/3-Kugel» (gewölbte Kappe, Kugelsegment).
- Ornament-Design der Charakter-Familie: Grösse (dezent/ausgewogen/
  markant), Lage im Feld (Fries oben/mittig/Sockel unten), Rhythmus
  (jedes Feld/jedes zweite) und Doppelreihe.
- Untergrund-abhängige 3D-Darstellung des Baukörpers: Beton (Platte),
  Holz (Bretter-Textur mit Maserung), Stahl (I-Träger-Andeutung),
  unbekannt (transparent angedeutet).
- Wandmontage zeigt Wandlaschen an den freien Enden.
- Tests auf 51 erweitert (Auto-Obergurt, Befestigungsmasse in Geometrie,
  Untergrund-Arten, Ornament-Einstellungen).

### Geländer-Modul: Konstruktionsoptionen (2026-07-18, vierter Ausbau)

- Konstruktion (Gurte): Untergurt mit einstellbarer Höhe, separater
  Obergurt (Rahmenbauweise) und Knieleiste mit eigenen Höhenfeldern;
  Höhenordnung wird validiert (ROT bei Widersprüchen); alle Gurte in
  Materialauszug, 3D und 2D.
- Handlauf-Position wählbar: aufgesetzt (über den Pfosten) oder als Gurt
  zwischen den Pfosten; Endkappen folgen der Handlaufachse.
- Endbogen jetzt konstruktiv echt: 90°-Viertel-Torus mit senkrechtem
  Abgang und Endscheibe statt Platzhalter-Zylinder.
- Fussplatten mit Wunschmassen (L×B×Dicke, Grenzen TESTDATEN) inkl.
  4-Anker-Bild in 3D; Schwerter mit 2 Ankern; Masse erscheinen im
  Materialauszug («Wunschmass», statische Bemessung vorbehalten).
- Werkstoffwahl Stahl/Edelstahl: Profil- und Oberflächenlisten werden
  nach Material gefiltert; Katalog 0.0.3-TESTDATEN mit 30 Profilen
  (inkl. Edelstahl-Serie, Quadratrohr 30, Gurt-Flachstahl 40×10).
- Wunschmass-Sonderprofile für Handlauf und Staketen (Ø-Eingabe,
  Vorschaubereich begrenzt): steuern 3D/Teilung, sind aber immer als
  «Sonderprofil – fachliche Prüfung» markiert (Bauplan-Regel bleibt:
  keine freien Querschnitte produktiv).
- Laserschnitt-Motive als Karten (Schlitze, Kreise, Quadrate, Floral)
  mit eigenen prozeduralen 3D-Texturen und SVG-Patterns.
- Charakter-Familie (geschmiedet) als sechste Füllungsart: Staketen-Basis
  plus Ornament-Grundauswahl Ringe/Voluten/Körbe als stilisierte
  3D-Elemente je Feld; Manufaktur-Hinweis (Feinausarbeitung persönlich).
- Tests auf 47 erweitert (Gurte, Handlauf-Position, Fussplattenmasse,
  Wunschprofile, Ornamente, Laser-Motive).

### Geländer-Modul: Fachgrundlagen-Ausbau (2026-07-18, dritter Ausbau)

- Fachgrundlage BFU 2.003 / SIA 358/261 / Metaltec als verbindliche
  Referenz abgelegt (`docs/gelaender-fachgrundlagen.md`); BFU-Richtwerte
  als quellenreferenzierte Konstanten (`BFU_RICHTWERTE`) implementiert.
- Neuer Schritt «Einsatzort» (Balkon, Terrasse, Dachterrasse/Attika,
  Französischer Balkon, Garten/Stützmauer, Podest/Galerie) mit
  ortsspezifischen Prüf-Hinweisen; Treppengeländer als KÜNFTIGER EIGENER
  Konfigurator, Industrie (Suva) und Bestandssanierung via Escape-Hatch.
- Neuer Schritt «Nutzung und Sicherheit»: Kinderschutz-Frage (12-cm-Kugel
  bis 750 mm, Kletterwirkung) und Absturzhöhe (≥1 m ⇒ BFU-Mindesthöhe
  1000 mm wird erzwungen → ROT bei Unterschreitung).
- Füllungsfamilien erweitert: Blech (Vollblech, Lochblech ≤5 cm-Hinweis,
  Laserschnitt) und Gitter (Streckmetall, Drahtgitter ≤4 cm-Hinweis);
  Querstab-Warnung verschärft sich bei Kindern (Leiterwirkung).
- Konstruktiv korrekte Darstellung: Untergurt (autom. Rahmenprofil,
  wählbar), Fussplatten (aufgesetzt), Schwerter (seitlich), Kragarme
  (von unten), eingelassene Pfosten sowie Betonplatte/Baukörper je
  Befestigungsart in 3D und Pfostenfüsse in der 2D-Zeichnung.
- Befestigungsarten erweitert: aufgesetzt, seitlich, von unten (Kragarm),
  eingelassen, Wand/Leibung (für franz. Balkone).
- 3D-Materialdarstellung: prozedurale Muster ohne externe Dateien
  (Lochblech-Rundlochung, Laserschlitze, Streckmetall-Rauten,
  Drahtgitter) als Alpha-Texturen; Farboption «Feuerverzinkt natur».
- 2D-Zeichnung mit denselben Mustern (SVG-Patterns).
- Tests auf 39 erweitert (BFU-Regeln, Panels, Untergurt, Befestigungs-
  darstellung).

### Geländer-Modul vertieft (2026-07-18, zweiter Ausbau)

- Grundformen erweitert: U-Form innen/aussen (drei Segmente, zwei geteilte
  Eckpfosten) über generischen Polygonzug-Pfad (ADR-004).
- Drei Geländertypen: Staketen, Querstab/Reling (Lagenberechnung),
  Glasfüllung (klar/satiniert, engerer Pfostenabstand, optional ohne
  Handlauf); Schmiede-Ornamente bewusst als Escape-Hatch zur individuellen
  Anfrage (Kernhandwerk).
- Handlauf-Abschlüsse: gerade Kappe, Endkugel, Endbogen 90° — in 3D und
  2D-Zeichnung dargestellt.
- Profilkatalog 0.0.2-TESTDATEN: 16 Profile über die Rollen Pfosten (4,
  inkl. T-Stahl und Flachstahl-Schmiedeoptik), Handlauf (4), Füllstab (4,
  inkl. Vierkant gedreht), Querstab (3); neue Rolle `querstab` und Form
  `t-profile` im Schema.
- 2D-Abwicklung exakt über Pfadkoordinate `tM` je Element (korrekt für
  L- und U-Formen); Glasfelder und Endkappen in der SVG-Zeichnung.
- Provisorischer Materialauszug (Werkstatt-Vorstufe der Stückliste) in der
  Zusammenfassung: Positionen, Stückzahlen, Zuschnittlängen — TESTDATEN.
- Neue Warnhinweise: Querstab erkletterbar (Fachprüfung), Glasaufbau wird
  fachlich bestimmt, «ohne Handlauf» prüfpflichtig.
- Recherche vertieft (Classic/Pure-Produktdaten, deutsches
  Optionsvokabular) und Werkstatt-Backlog für den Meister dokumentiert.
- Tests auf 33 erweitert (U-Pfad, Querstab-Lagen, Glasfelder, Endkappen,
  Abwicklungs-Monotonie, Materialauszug).

### Konfigurator-Kern und Geländer-Modul (2026-07-18)

- Gemeinsamer Assistenten-Kern: Schrittkarten mit progressiver Freischaltung,
  Bildkarten-Optionen mit Piktogrammen (Tastatur-/Screenreader-tauglich),
  Zahlenfelder mit Messhilfen, Autosave (localStorage) und
  Konfigurations-Link zum Speichern/Teilen (CFG-001/002, Grundlagen).
- Geländer-Modul (RAIL-001/002/003/004 in erster Ausbaustufe): Form I/L,
  Einbausituation, Montage/Untergrund, Masse (inkl. «ungefähr»),
  Profilwahl aus dem Katalog (rollenbasierte Freigaben), Oberfläche/Farbe,
  Montageservice; Escape-Hatch «Individuelle Ausführung anfragen».
- Ableitungen: Pfostenverteilung (max. Achsabstand, geteilter Eckpfosten)
  und symmetrische Füllstabverteilung — Parameter als TESTDATEN markiert,
  Ergebnisse als «provisorisch» gekennzeichnet (A-004).
- 3D-Viewer (3D-001): parametrische Szene aus reinem Geometriemodell,
  Ansichts-Presets (Perspektive/Front/Seite/Oben), ein-/ausblendbare
  Masslinien mit DOM-Labels, mobile Qualitätsstufe, Orbit-Steuerung.
- 2D-Masszeichnung (SVG) als gleichwertige Ansicht und WebGL-Fallback;
  Grundlage der späteren PDF-Zeichnung.
- Regelprüfung Geländer (Grün/Gelb/Rot als Vorschau, Server bleibt
  Autorität): Grenzmasse, Profilfreigaben, Aufmass- und Untergrund-Hinweise;
  ohne Regel-/Preisfreigabe maximal GELB und «Individuelle Prüfung».
- Behoben: drei/troika-`<Text>` konnte die gesamte 3D-Szene blockieren
  (Font-Ladeworker) → Masslinien-Labels als DOM-Overlays; Ansichtswechsel
  ohne Canvas-Remount (kein WebGL-Kontextverlust mehr).
- 13 neue Unit-Tests (26 total): Pfosten-/Stabverteilung, Geometriemodell,
  Regelstufen.

### Phase 0 – Projektgrundlage (2026-07-18)

- Repository und Projektstruktur gemäss Bauplan angelegt (FND-001).
- Docker-Compose-Umgebung: WordPress, MariaDB, Mailpit, wp-cli.
- Skelett des Block-Themes `webforge` erstellt (WP-001, Grundgerüst).
- Skelett des Plugins `webforge-core` erstellt (WP-002, Grundgerüst):
  Inhaltstypen, REST-Namespace `webforge/v1`, Health-Endpunkt.
- Konfigurator-Grundanwendung (React + TypeScript + Vite) mit
  Produktauswahl Geländer / Gartentor / Fenstergitter (CFG-001, CFG-002 Grundgerüst).
- Versionierte Produktdaten-Schemas und klar markierte Testdaten (PROF-001 Grundlage).
- Design-Tokens als gemeinsame Quelle für Website und Konfigurator (Entwurf, Gate A offen).
- Architekturentscheidungen ADR-001 bis ADR-003 dokumentiert.
- Offene Annahmen in `docs/assumptions.md` festgehalten.
- Bestandsaufnahme der alten Website (öffentlicher Teil) inkl. Firmendaten,
  Seiteninventar, Weiterleitungsplan und Migrationsliste (FND-002 teilweise).
- Konfigurator-Marktrecherche (metallbauXpress, Kordo u. a.) mit
  UX-Konsequenzen für die drei Module dokumentiert.
- Echte Firmendaten in Footer und Vision übernommen.
