# Konfigurator-Modell

## Module

Genau drei Produktmodule auf einem gemeinsamen Kern:

```text
/konfigurator/                 Produktauswahl (3 Karten, keine „Demnächst“-Module)
/konfigurator/gelaender/       Geländer (gerade, L-förmig)
/konfigurator/gartentor/       Gartentor (ein-/zweiflügelig)
/konfigurator/fenstergitter/   Fenstergitter (rechteckig, fest)
```

Umsetzungsreihenfolge: Kern → Profilkatalog → Geländer → Fenstergitter → Gartentor
(Fenstergitter vor Gartentor, weil es Geländerfunktionen wiederverwendet).

## Gemeinsamer Ablauf

```text
Produktauswahl → Einbausituation → Masse → Design und Füllung
→ Standardprofile → Material/Oberfläche/Farbe → Befestigung/Zubehör
→ 3D-Vorschau → Regelprüfung → Richtpreis/Preisspanne
→ Upload → PDF + Projektnummer → Offertanfrage
```

## Datensatz einer Konfiguration

Strukturiert und versioniert — nie nur ein Screenshot:

```json
{
  "configurationId": "WFC-2026-000123",
  "product": "gelaender",
  "productVersion": "0.0.0",
  "ruleVersion": "0.0.0",
  "priceVersion": null,
  "status": "draft",
  "inputs": {},
  "derived": {},
  "validation": { "level": "yellow", "warnings": [] },
  "estimate": { "type": "individual-review", "currency": "CHF" }
}
```

`priceVersion: null` bedeutet: keine freigegebene Preisversion vorhanden →
Preisart „Individuelle Prüfung“ (siehe ADR-003 und Annahme A-003).

## Ebenentrennung (verbindlich)

```text
Konfigurationsdaten → Produktregeln → abgeleitete Werte
→ Preisberechnung → Geometriemodell → 3D-Darstellung
```

Der 3D-Viewer erhält ausschliesslich ein berechnetes Geometriemodell.
Der Konfigurator bleibt ohne 3D-Bedienung vollständig nutzbar
(2D-Fallback bei fehlender WebGL-Unterstützung, Tastaturbedienung).

## Plattformfunktionen des Kerns

Schrittassistent mit Vor/Zurück ohne Datenverlust, Zwischenspeicherung,
Wiederaufnahme (Token/URL), Validierungsnachrichten, Upload-Komponente,
API-Kommunikation mit Fehlerbehandlung, Zusammenfassung, PDF-Anforderung,
mobile Qualitätsstufe im 3D-Viewer.
