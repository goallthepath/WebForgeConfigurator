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

Verbindliche Grundlage ist der **Bauplan für die WebForge-Plattform**
(siehe [docs/project-vision.md](project-vision.md) und die ADRs unter [docs/decisions/](decisions/)).

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

Erststart von WordPress (bereits erledigt in dieser Umgebung):

```text
docker compose run --rm wpcli wp core install --url=http://localhost:8080 \
  --title="Musterschlosserei (lokale Entwicklung)" \
  --admin_user=webforge-admin --admin_password=webforge_dev_only \
  --admin_email=dev@webforge.local --skip-email
docker compose run --rm wpcli wp theme activate webforge
docker compose run --rm wpcli wp plugin activate webforge-core
docker compose run --rm wpcli wp rewrite structure "/%postname%/" --hard
```

Lokaler Backend-Login: `webforge-admin` / `webforge_dev_only`
(nur lokale Entwicklung — niemals für Staging oder Produktion verwenden).

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

Siehe [CHANGELOG.md](../CHANGELOG.md) und offene Annahmen in [docs/assumptions.md](assumptions.md).
