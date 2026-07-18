# Abnahmekriterien

## Phase 0 – Projektgrundlage

```text
[x] Repository mit dokumentierter Struktur vorhanden
[x] docker compose up startet WordPress, Datenbank und Mailpit lokal
[x] WordPress-Backend lokal erreichbar (http://localhost:8080/wp-admin)
[x] Konfigurator-Grundprojekt startet (npm run dev) und baut (npm run build)
[x] Automatische Tests laufen (npm test)
[ ] Bestandsaufnahme der bestehenden Installation (blockiert durch A-001)
[ ] Backup des Altsystems geprüft (blockiert durch A-001)
[x] Alte Website wurde nicht verändert (kein Zugriff erfolgt)
```

## Abnahme pro Produktmodul (Geländer, Gartentor, Fenstergitter)

Lokal vollständig durchführbar:

```text
Produkt auswählen → Einbausituation → Masse → Standardprofile
→ Gestaltung/Oberfläche → 3D prüfen → Richtpreis sehen → Upload
→ Konfiguration speichern → PDF → Offertanfrage absenden
→ Anfrage im WordPress-Backend öffnen → E-Mail in Mailpit kontrollieren
```

Zusätzlich nachzuweisen:

- Browser und Server verwenden dieselben Regeln (Vertragstest).
- Inaktive Profile werden serverseitig abgewiesen.
- Ungültige Kombinationen können nicht abgesendet werden.
- Ungefähre Masse führen zu Preisspanne oder Prüfpflicht.
- Profil-, Regel- und Preisversion werden gespeichert.
- Neustart der lokalen Umgebung verliert keine Daten.
- Alle drei Produkte funktionieren auf Mobilgeräten.

## Definition of Done (jede Funktion)

Code implementiert · Fehlerzustände behandelt · automatisierte Tests grün ·
mobil geprüft · Tastatur bedienbar · Berechtigungen geprüft · Doku aktuell ·
keine Zugangsdaten im Code · keine offenen Platzhalter · auf Staging sichtbar ·
Abnahmekriterien nachweislich erfüllt. Für Preis-/Regeländerungen zusätzlich:
serverseitige Prüfung, gespeicherte Version, Testfälle, alte Konfigurationen
bleiben reproduzierbar.
