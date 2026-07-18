# Inhaltsmodell (WordPress)

Alle strukturierten Inhaltstypen werden vom Plugin `webforge-core` registriert
(nicht vom Theme), damit sie bei einem Themewechsel erhalten bleiben.

## Inhaltstypen

| Typ (`post_type`) | Zweck | Öffentlich |
| --- | --- | --- |
| `webforge_leistung` | Leistungen (Geländer, Tore, Treppen, …) | ja |
| `webforge_referenz` | Strukturierte Projektberichte | ja |
| `webforge_material` | Stahl, Edelstahl, Glas, … | nein (API) |
| `webforge_oberflaeche` | Pulverbeschichtung, Verzinkung, … | nein (API) |
| `webforge_wissen` | Fachartikel und Kundeninformationen | ja |
| `webforge_anfrage` | Projekt- und Konfiguratoranfragen | nein |
| `webforge_konfiguration` | Gespeicherte Produktkonfigurationen | nein |

## Referenz-Pflichtfelder

Aufgabe, Lösung, Material, Oberfläche, Projektort, Besonderheit,
Gesamtbilder, Detailbilder. Mindestens sechs Referenzen vor Veröffentlichung.

## Anfrage-Statusmodell

```text
Neu → In Prüfung → Rückfrage → Aufmass geplant → Offeriert → Gewonnen | Verloren → Archiviert
```

Statuswechsel werden mit Zeitpunkt und Benutzer protokolliert.
Interne Notizen sind pro Anfrage möglich.

## Anfragewege (vier getrennte Formulare)

1. **Standardprodukt** – Produkt → Einbausituation → ungefähre Masse → Material → Montage → Upload → Kontakt.
2. **Individuelle Lösung** – Projektart → Beschreibung → Stil → Fotos/Pläne → Ort → Zeitraum → Kontakt.
3. **Reparatur/Restauration** – Bauteil → Schaden → Dringlichkeit → Fotos → Standort → Kontakt.
4. **Architektenanfrage** – Projektart → Phase → Pläne → technische Anforderungen → Termin → Kontaktperson.

Gemeinsame Systemfunktionen: Projektnummer (`WFC-JJJJ-NNNNNN`), sichere
Uploads (Typ- und Grössenprüfung anhand Inhalt), E-Mail-Bestätigung an Kunde,
Benachrichtigung an den Meister, Duplikatschutz, Fehlerprotokollierung.
Keine personenbezogenen Daten in öffentlichen URLs.
