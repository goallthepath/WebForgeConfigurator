# Änderungsverlauf

Alle nennenswerten Änderungen an der WebForge-Plattform werden hier dokumentiert.

## [Unreleased]

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
