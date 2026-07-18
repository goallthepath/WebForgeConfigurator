# WebForge Plattform

Digitale Werkstatt der Musterschlosserei: WordPress-Website, Projektanfrage-System
und React-Konfigurator für **Geländer, Gartentore und Fenstergitter**.

## Architektur (Kurzfassung)

| Baustein | Technologie | Ort |
| --- | --- | --- |
| Website & CMS | WordPress, eigenes Block-Theme `webforge` | `wordpress/wp-content/themes/webforge/` |
| Fachlogik & API | Plugin `webforge-core` (Inhaltstypen, REST, Anfragen) | `wordpress/wp-content/plugins/webforge-core/` |
| Konfigurator | React, TypeScript, React Three Fiber | `configurator/` |
| Produktdaten | Versionierte JSON-Kataloge und Schemas | `product-data/` |
| Design-Tokens | Gemeinsame Farben/Typografie für Website und Konfigurator | `design-tokens/` |

Verbindliche Grundlage ist der **Bauplan für den WebForge Build Agent**
(siehe [docs/project-vision.md](docs/project-vision.md) und die ADRs unter [docs/decisions/](docs/decisions/)).

## Lokale Entwicklung

Voraussetzungen: Docker Desktop, Node.js ≥ 20.

```text
# WordPress + Datenbank + Mailpit starten
docker compose up -d

# WordPress:        http://localhost:8080
# Mailpit (E-Mail): http://localhost:8025

# Konfigurator (eigener Dev-Server)
cd configurator
npm install
npm run dev        # http://localhost:5173/konfigurator/
```

Erststart von WordPress: Installation über http://localhost:8080 durchführen,
danach Theme `WebForge` und Plugin `WebForge Core` im Backend aktivieren
(oder per wp-cli: `docker compose run --rm wpcli wp theme activate webforge` usw.).

## Prüfungen

```text
cd configurator
npm test           # Unit-Tests (Vitest)
npm run typecheck  # TypeScript
npm run build      # Produktions-Build (Basis /konfigurator/)
```

## Verbindliche Grundsätze

- Keine erfundenen Preise, Profilmasse oder technischen Grenzwerte —
  fehlende Werte sind als **„fachliche Freigabe erforderlich“** markiert.
- Preis- und Regelprüfung erfolgt beim Absenden **serverseitig**.
- Jede Konfiguration speichert Produkt-, Regel- und Preisversion.
- Keine direkte Arbeit an der öffentlichen Website; Veröffentlichung nur nach Staging-Abnahme.
- Testdaten sind immer klar als `TESTDATEN` gekennzeichnet.

## Projektstand

Siehe [CHANGELOG.md](CHANGELOG.md) und offene Annahmen in [docs/assumptions.md](docs/assumptions.md).
