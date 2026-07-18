# Deployment und Umgebungen

## Umgebungen

| Umgebung | Zweck | Stand |
| --- | --- | --- |
| Lokal | Docker Compose: WordPress, MariaDB, Mailpit, wp-cli | eingerichtet |
| Staging | Abnahmeumgebung, öffentlich geschützt | offen (A-007) |
| Produktion | Live-Website | offen; nie direkt bearbeiten |

## Artefakte

1. **Theme `webforge`** – Verzeichnis-Deploy nach `wp-content/themes/webforge`.
2. **Plugin `webforge-core`** – Verzeichnis-Deploy nach `wp-content/plugins/webforge-core`.
3. **Konfigurator** – `npm run build` erzeugt statische Dateien mit Basis
   `/konfigurator/`; Deploy in das entsprechende Web-Root-Unterverzeichnis.
4. **Produktdaten** – versionierte Kataloge; werden mit Plugin und
   Konfigurator gemeinsam ausgerollt (gleicher Katalogstand beidseitig).

## Veröffentlichungsprozess (Zielbild)

```text
Lokal grün (Tests) → Deploy auf Staging → Staging-Abnahme (Gate D)
→ Freigaben Gate E → Backup Produktion → Deploy Produktion → Smoke-Test
```

Rücksetzprozess: vorheriges Artefakt + Datenbank-Backup wiederherstellen;
wird vor Go-Live einmal real geprobt.

## Veröffentlichung ist blockiert, solange

Platzhaltertexte produktiv wären; Preise/Produktregeln nicht freigegeben sind;
E-Mail-Versand nicht zuverlässig ist; Backups nicht getestet sind;
Datenschutztexte oder Weiterleitungen fehlen; Uploads öffentlich erreichbar
wären; kritische Tests fehlschlagen; die Backend-Abnahme durch den Meister fehlt.
