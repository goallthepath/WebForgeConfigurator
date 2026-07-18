# Infrastruktur

| Verzeichnis | Inhalt | Stand |
| --- | --- | --- |
| `staging/` | Staging-Umgebung (öffentlich geschützt, Abnahme Gate D) | offen – Hosting unbekannt (A-007) |
| `production/` | Produktionsumgebung (nie direkt bearbeiten) | offen – Hosting unbekannt (A-007) |
| `scripts/` | Deploy-, Backup- und Prüfskripte | folgt mit OPS-001 |

Lokale Entwicklung läuft über `docker-compose.yml` im Repository-Root.
Anforderungen an Staging/Produktion: siehe docs/deployment.md und docs/security.md.
