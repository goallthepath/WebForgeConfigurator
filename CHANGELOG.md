# Änderungsverlauf

Alle nennenswerten Änderungen an der WebForge-Plattform werden hier dokumentiert.

## [Unreleased]

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
