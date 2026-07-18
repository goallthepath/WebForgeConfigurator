# Architektur

## Überblick

```text
Besucher
│
├── WordPress-Website (Theme webforge, Gutenberg-Blöcke)
│   ├── Inhalte, Leistungen, Referenzen, Wissen
│   └── Projektanfragen (4 Wege)
│
└── React-Konfigurator (/konfigurator/)
    ├── Produktauswahl: Geländer | Gartentor | Fenstergitter
    ├── Schrittassistent + zentraler Konfigurationszustand
    ├── 3D-Viewer (React Three Fiber) — erhält nur ein Geometriemodell
    └── Zusammenfassung, Richtpreis, Offertanfrage
          │
          ▼
    WebForge REST API (Plugin webforge-core, Namespace webforge/v1)
          ├── Produkte, Profile, Regeln, Preise (versioniert)
          ├── Konfigurationen (speichern/laden)
          ├── Datei-Uploads, PDF, E-Mail
          └── Anfragen inkl. Statusmodell
                    │
                    ▼
             WordPress-Backend (Verwaltung durch den Meister)
```

## Trennung der Ebenen (verbindlich)

```text
Konfigurationsdaten → Produktregeln → abgeleitete Werte → Preisberechnung → Geometriemodell → 3D-Darstellung
```

Die 3D-Szene verwaltet keine Geschäftsdaten. Produktlogik liegt nie in
3D-Komponenten. Regeln und Preise existieren doppelt lauffähig:
im Frontend als Vorschau, im Server (`webforge-core`) als Autorität.

## Serverseitige Autorität

Beim Absenden einer Konfiguration führt der Server immer aus:

1. Konfiguration erneut validieren.
2. Abgeleitete Mengen erneut berechnen.
3. Aktuelle Preisversion anwenden.
4. Sicherheitsstatus (Grün/Gelb/Rot) bestimmen.
5. Ergebnis inkl. Versionen speichern.
6. Abweichungen gegenüber dem Browserwert protokollieren.

## Versionierung

Jede gespeicherte Konfiguration enthält `productVersion`, `ruleVersion`,
`priceVersion`, Berechnungszeitpunkt, Eingaben, serverseitiges Ergebnis,
offene Annahmen und Sicherheitsstatus. Alte Anfragen bleiben dadurch
reproduzierbar, auch wenn Kataloge später ändern.

## Standardprofil-Logik

Jedes Bauteil referenziert eine `profileId` aus dem versionierten
Profilkatalog (`product-data/`). Dieselbe `profileId` steuert 3D-Querschnitt,
Masse, Material, Gewicht, Oberfläche, Preis, Regeln, PDF, Anfrage und spätere
Stückliste. Profile werden nur in ausdrücklich freigegebenen Produkten angeboten.

## Umgebungen

| Umgebung | Zweck | Regeln |
| --- | --- | --- |
| Lokal (Docker Compose) | Entwicklung, Mailpit als E-Mail-Test | Testdaten erlaubt (markiert) |
| Staging | Abnahme durch den Meister | öffentlich geschützt |
| Produktion | Live-Website | nie direkt bearbeiten; Deploy nur nach Gate D/E |

Details siehe [deployment.md](deployment.md) und [security.md](security.md).
Entscheidungen siehe [decisions/](decisions/).
