# Offene Annahmen und fehlende Eingangsdaten

Stand: 2026-07-18. Fehlende Daten blockieren die Entwicklung nicht;
betroffene Funktionen bleiben mit `TESTDATEN` markiert und werden nicht
produktiv geschaltet.

## A-001 Bestehende WordPress-Installation nicht zugänglich

Es liegen keine Zugangsdaten zur bestehenden Website (Hosting, WordPress,
DNS, E-Mail) vor. Die Bestandsaufnahme (Phase 0), Backup-Prüfung (FND-003)
und der Weiterleitungsplan sind deshalb **offen** und benötigen:
WordPress-Admin, Hosting-Zugang, Domain-/DNS-Zugang, SMTP-Daten, Backup-Zugang.
→ Bis dahin: Aufbau erfolgt vollständig lokal auf leerer Installation;
die alte Website wird nicht berührt.

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

## A-005 Marken- und Inhaltsdaten offen

Logo, korrekte Firmierung, Adresse, Telefonnummer, Domain-E-Mail,
Einsatzgebiet, Biografie des Inhabers sowie mindestens sechs strukturierte
Referenzprojekte mit Bildern fehlen. Vorlagen dafür entstehen mit den
Inhaltstypen; Staging darf markierte Platzhalter zeigen, Produktion nie.

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
