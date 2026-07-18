# ADR-003: Richtpreislogik und serverseitige Regelautorität

Status: Angenommen (verbindliche Vorgabe des Bauplans) · Datum: 2026-07-18

## Kontext

Der Konfigurator zeigt Preise vor der persönlichen Prüfung. Falsche
Genauigkeit oder im Browser manipulierbare Preise wären geschäftsschädigend.

## Entscheidung

- Drei Preisausgaben: **Richtpreis**, **Preisspanne**, **Individuelle Prüfung**.
  Kein Onlinekauf, keine verbindliche automatische Offerte.
- Sicherheitsstufen **Grün / Gelb / Rot** klassifizieren jede Konfiguration
  (Standard & plausibel / Fachprüfung oder Aufmass nötig / nicht automatisch
  freigegeben).
- Der Browserpreis ist nur Vorschau. Beim Absenden validiert und berechnet
  der Server (`webforge-core`) alles erneut mit der aktuellen Preisversion,
  bestimmt den Sicherheitsstatus, speichert das Ergebnis und protokolliert
  Abweichungen zum Browserwert.
- Inaktive Profile/Optionen und ungültige Kombinationen werden serverseitig
  abgewiesen, unabhängig vom Frontend-Zustand.
- Preisänderungen erzeugen eine **neue Preisversion**; bestehende
  Konfigurationen behalten ihre ursprüngliche Berechnung.
- Bis zur Gate-C-Freigabe existiert keine Preisversion → alle Konfigurationen
  erhalten die Preisart „Individuelle Prüfung“. Es werden keine Preise erfunden.

## Konsequenzen

- Regel- und Preislogik braucht Unit-Tests auf beiden Seiten plus
  Vertragstests Frontend ↔ API.
- Ungefähre Masse führen automatisch zu Preisspanne oder Prüfpflicht.
