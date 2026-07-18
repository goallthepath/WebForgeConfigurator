# Änderungsverlauf

Alle nennenswerten Änderungen an der WebForge-Plattform werden hier dokumentiert.

## [Unreleased]

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
