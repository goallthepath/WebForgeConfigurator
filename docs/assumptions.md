# Offene Annahmen und fehlende Eingangsdaten

Stand: 2026-07-18. Fehlende Daten blockieren die Entwicklung nicht;
betroffene Funktionen bleiben mit `TESTDATEN` markiert und werden nicht
produktiv geschaltet.

## A-001 Bestehende WordPress-Installation: nur öffentlicher Teil zugänglich (teilweise aufgelöst 2026-07-18)

Der **öffentliche Teil** der alten Website wurde vollständig inventarisiert —
Seiten, Inhalte, ~65 Projektbilder, Firmendaten und Weiterleitungsplan sind
in [legacy-site-inventory.md](legacy-site-inventory.md) dokumentiert.
**Weiterhin offen** (benötigt Zugangsdaten): Backend-/Hosting-Zugang für
Backup-Prüfung (FND-003), Plugin-/Theme-/PHP-Inventar, Original-Bilddateien,
DNS/SMTP. → Aufbau erfolgt lokal; die alte Website wird nicht verändert.

## A-002 Profilkatalog nicht freigegeben

Der WebForge-Standardprofil-Katalog (Querschnitte, Wandstärken, zulässige
Kombinationen) liegt nicht vor. `product-data/` enthält nur Schemas und
klar markierte Testprofile. Jedes Feld mit fachlichem Grenzwert trägt die
Markierung `"approval": "fachliche Freigabe erforderlich"`.

## A-003 Keine Preisfaktoren vorhanden

Es existiert keine freigegebene Preisversion. Der Konfigurator zeigt bis zur
Freigabe (Gate C) ausschliesslich die Preisart **„Individuelle Prüfung“**.
Es werden keine Preiswerte erfunden, auch nicht als Platzhalterzahlen.

## A-004 Technische Grenzwerte offen

Minimal-/Maximalmasse, Halter- und Pfostenabstände, Stababstände usw. sind
nicht freigegeben. Der Regelkatalog führt diese Regeln mit Status
`fachliche Freigabe erforderlich`; betroffene Prüfungen liefern bis zur
Freigabe die Sicherheitsstufe **Gelb** (Fachprüfung erforderlich) oder Rot.

## A-005 Marken- und Inhaltsdaten (teilweise aufgelöst 2026-07-18)

**Aus der alten Website übernommen:** Firmierung «Musterschlosserei» (Einzelunternehmen), Inhaber N. N., Musterstrasse 1,
0000 Musterort, Tel. 000 000 00 00, UID CHE-000.000.000, Kurzbiografie, schweizweite Lieferung/Montage.
**Weiterhin offen:** Logo-Originaldateien, Original-Projektbilder in voller
Auflösung, mindestens sechs strukturierte Referenzen (Aufgabe/Lösung/
Material/Ort), Öffnungszeiten, **Domain-E-Mail** (aktuell nur
info@example.ch — für zuverlässigen Anfrageversand muss eine
Adresse wie info@example.ch eingerichtet werden, Gate E).

## A-006 Design noch ohne Gate-A-Freigabe

Die Design-Tokens in `design-tokens/tokens.json` sind ein Entwurf
(ruhige, werkstattnahe Anmutung). Farb- und Schriftwelt benötigen die
Freigabe an **Gate A**.

## A-007 Hosting-Ziel unbekannt

Staging-/Produktions-Hosting (Anbieter, PHP-Version, Deploy-Weg) ist offen.
`infrastructure/` beschreibt vorerst nur Anforderungen, keine konkreten Ziele.

## A-008 Domainpfad Konfigurator

Angenommen wird die Einbindung unter `https://example.ch/konfigurator/`
(Basis-Pfad `/konfigurator/` ist im Vite-Build fest konfiguriert).
Falls die Domain abweicht, ist nur die Deploy-Konfiguration betroffen.
