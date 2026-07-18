# ADR-001: WordPress als CMS, Konfigurator als separate React-Anwendung

Status: Angenommen (verbindliche Vorgabe des Bauplans) · Datum: 2026-07-18

## Kontext

Die Plattform braucht redaktionell pflegbare Inhalte (Leistungen, Referenzen,
Wissen, Anfragen) und einen interaktiven 3D-Produktkonfigurator. Beides in
einer Technologie zu erzwingen führt entweder zu einem schwerfälligen
WordPress-Frontend oder zu einem CMS-Eigenbau.

## Entscheidung

- **WordPress** bleibt Inhalts- und Verwaltungsplattform. Neues, schlankes
  **Block-Theme `webforge`** mit nativen Gutenberg-Blöcken; kein Page-Builder.
- Fachlogik liegt im eigenen Plugin **`webforge-core`** (Inhaltstypen, REST-API
  `webforge/v1`, Anfragen, Konfigurationsspeicherung, PDF, E-Mail, Versionen).
- Der **Konfigurator** ist eine eigenständige React-/TypeScript-Anwendung
  (Vite), statisch gebaut und unter **`/konfigurator/`** derselben Domain
  eingebunden. 3D über React Three Fiber / Three.js.
- Die Integration wirkt für Besucher wie eine zusammenhängende Website
  (gemeinsame Design-Tokens, gemeinsamer Header-Eindruck).

## Konsequenzen

- WordPress führt den 3D-/Produktkern nicht aus; es liefert Inhalte und API.
- Zwei Build-Welten (PHP/WordPress und Node/Vite) → Docker Compose lokal,
  klar dokumentierter Deploy pro Artefakt.
- Vertragstests zwischen Konfigurator und `webforge/v1`-API sind Pflicht.
