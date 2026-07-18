# Bestandsaufnahme bestehende Website (example.ch)

Stand: 2026-07-18. Quelle: öffentlich zugängliche Website (kein Backend-Zugang,
siehe A-001). Die alte Website wurde nur gelesen, nicht verändert.

## Firmendaten (verbindlich, aus Impressum)

| Feld | Wert |
| --- | --- |
| Firmierung | **Musterschlosserei** (Einzelunternehmen) |
| Inhaber | N. N. |
| Adresse | Musterstrasse 1, 0000 Musterort (SZ) |
| Telefon | 000 000 00 00 |
| E-Mail | info@example.ch ⚠ keine Domain-E-Mail |
| UID | CHE-000.000.000 |
| Einzugsgebiet | «Lieferung und Montage schweizweit» |

Weitere Fakten (Über-mich-Seite): anonymisiert.

⚠ **Domain-E-Mail:** Der Bauplan verlangt eine Domain-E-Mail für den
zuverlässigen Anfrageversand (SPF/DKIM). Die Freemail-Adresse ist dafür
ungeeignet — Einrichtung einer Adresse wie `info@example.ch`
gehört auf die Liste der Betriebsvoraussetzungen (Gate E).

## Seiteninventar

| Alte URL | Inhalt | Bilder | Texte |
| --- | --- | --- | --- |
| `/` | Startseite, Kernbotschaften Handwerkskunst/Präzision/Authentizität | Logo | kurz |
| `/gelaender/` | Galerie Geländer | 9 | praktisch keine |
| `/gartentore/` | Galerie Gartentore | 14 | praktisch keine |
| `/fenstergitter/` | Galerie Fenstergitter (Aufnahmen 2008–2011) | 16 | praktisch keine |
| `/metalltreppen/` | Galerie Metalltreppen | 9 | praktisch keine |
| `/vordaecher/` | Galerie Vordächer | 8 | nur Überschrift |
| `/spezialanfertigungen/` | Galerie (Aufnahmen 2019–2021) | 9 | praktisch keine |
| `/ueber-mich/` | Biografie des Inhabers, Porträt | 1–2 | kurz |
| `/impressum/` | Impressum + Datenschutz kombiniert | – | vorhanden |

Technik: WordPress (an `/wp-content/` erkennbar), © 2024.
**Rund 65 Projektbilder** vorhanden — wertvollster Bestand für Referenzen;
Auflösung/Originale unbekannt, Original-Dateien beim Inhaber anfragen.

## Schwächen der alten Website (Chancen der neuen)

- Keine Handlungsaufrufe: kein Formular, kein Projektstart, keine
  Telefon-/Upload-CTAs auf den Leistungsseiten.
- Galerien ohne Kontext: keine Aufgabe/Lösung/Material-Angaben, keine
  strukturierten Referenzen.
- Kaum Text → kaum Suchmaschinenrelevanz pro Leistung.
- Keine Seiten für Reparatur/Restauration, Architekten, Wissen, Datenschutz
  als eigene Seite.

## Weiterleitungsplan (alt → neu)

| Alte URL | Neue Zielseite |
| --- | --- |
| `/` | `/` (neue Startseite) |
| `/gelaender/` | Leistung Geländer und Handläufe |
| `/gartentore/` | Leistung Tore und Zäune |
| `/fenstergitter/` | Leistung Fenstergitter |
| `/metalltreppen/` | Leistung Treppen |
| `/vordaecher/` | Leistung Vordächer |
| `/spezialanfertigungen/` | Leistung Spezialanfertigungen |
| `/ueber-mich/` | Über WebForge |
| `/impressum/` | Impressum (Datenschutz wird eigene Seite) |

Da die Slugs weitgehend identisch bleiben können, sind echte 301-Umleitungen
nur nötig, falls sich Pfade ändern (z. B. `/ueber-mich/` → `/ueber-webforge/`).
Entscheidung bei Gate A (Sitemap-Freigabe).

## Migrationsliste

1. Alle Galeriebilder sichern (Original-Dateien beim Inhaber anfragen —
   Web-Versionen nur als Rückfallebene).
2. Aus den besten Projektfotos mindestens sechs strukturierte Referenzen
   aufbauen (Aufgabe/Lösung/Material/Ort ergänzen — Angaben vom Meister nötig).
3. Über-mich-Text als Grundlage für «Über WebForge» übernehmen und ausbauen
   (Ausbildungstätigkeit als Vertrauenselement).
4. Impressumsdaten übernehmen; Datenschutz auf neuen Stand bringen
   (Uploads, Konfigurator, Mailversand ergänzen).
5. Kontaktdaten überall einheitlich: 000 000 00 00, Musterstrasse 1,
   0000 Musterort; E-Mail nach Einrichtung der Domain-Adresse.
