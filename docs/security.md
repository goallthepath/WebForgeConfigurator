# Sicherheit

## Konten und Zugriff

- Sichere Passwörter, Zwei-Faktor-Authentifizierung für Admin-Konten.
- Getrennte Administrator- und Redaktionskonten (Meister: Redaktion + Anfragen).
- Keine Geheimnisse im Frontend oder im Repository (`.env` ist ignoriert;
  `.env.example` enthält nur lokale Beispielwerte).

## Uploads

- Dateityp-Prüfung anhand des tatsächlichen Inhalts (Magic Bytes), nicht nur
  der Endung. Erlaubt: gängige Bild- und Planformate (JPEG, PNG, WebP, PDF).
- Grössenlimits pro Datei und pro Anfrage.
- Ablage ausserhalb erratbarer URLs; Auslieferung nur über berechtigte,
  nicht öffentliche Endpunkte. Kundendateien nie öffentlich verlinken.

## API

- Öffentliche `webforge/v1`-Endpunkte auf das Minimum beschränkt
  (Kataloge lesen, Konfiguration/Anfrage einreichen).
- Schreibende Endpunkte: Nonce/Token, Ratenbegrenzung, Duplikatschutz
  (Idempotenzschlüssel pro Übertragung), Spam-Schutz ohne Dark Patterns.
- Serverseitige Neuberechnung von Regeln und Preisen (ADR-003) —
  Browserwerte sind nie autoritativ.
- Keine personenbezogenen Daten in URLs oder Query-Strings.

## Betrieb

- Regelmässige Backups (Datenbank + Dateien) mit dokumentiertem
  Wiederherstellungstest vor Go-Live.
- Fehlerprotokollierung ohne sensible Inhalte; Überwachung von
  Verfügbarkeit und Fehlerraten.
- Automatische Updates nur, wo kontrolliert getestet.
- Staging ist öffentlich geschützt (HTTP-Auth o. ä.) und wird nicht indexiert.

## Offene Punkte

Konkrete Hosting-Härtung folgt, sobald das Hosting-Ziel bekannt ist (A-007).
