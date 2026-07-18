# ADR-004: Umfang und Struktur des Geländer-Moduls (Release 1)

Status: Angenommen · Datum: 2026-07-18

## Kontext

Das Geländer-Modul ist das Leitmodul des Konfigurators und muss die
Konkurrenz (metallbauXpress u. a.) in Tiefe und Erlebnis übertreffen,
ohne die verbindlichen Grundsätze zu verletzen (keine erfundenen
Fachwerte, Offertanfrage statt Checkout, Server-Autorität).

## Entscheidung

**Grundformen:** I, L innen, L aussen, U innen, U aussen — als generischer
Polygonzug mit ±90°-Drehungen implementiert (`runsFromInputs`). Mehr Ecken,
freie Winkel, Treppenläufe → Escape-Hatch «Individuelle Ausführung anfragen».

**Geländertypen (Füllungsarten):**

| Typ | Parametrik | Hinweispflicht |
| --- | --- | --- |
| Staketen (senkrecht) | Stabteilung symmetrisch, lichter Abstand ≤ Parameter | – |
| Querstab / Reling | Lagenzahl aus freier Höhe ≤ Parameter | erkletterbar → Fachprüfung |
| Glas | Felder = Pfostenfelder; engerer Pfostenabstand; klar/satiniert; optional ohne Handlauf | Glasaufbau/Stärke wird fachlich bestimmt |
| Schmiede-Ornamente | bewusst NICHT parametrisiert | Escape-Hatch → individuelle Anfrage (Kernhandwerk) |

**Handlauf-Abschlüsse:** gerade Kappe, Endkugel, Endbogen 90° — nur an den
freien Enden des Polygonzugs.

**Profilkatalog:** Rollen `pfosten`, `handlauf`, `fuellstab`, `querstab`
mit je 3–4 TESTDATEN-Profilen (inkl. T-Stahl und Schmiedeoptik-Varianten),
Freigabe strikt je Produkt+Rolle. Dieselbe profileId steuert 3D-Querschnitt,
2D-Zeichnung, Teilungsberechnung und Materialauszug.

**2D-Abwicklung:** Jedes Geometrieelement trägt eine Pfadkoordinate `tM`;
die SVG-Zeichnung wickelt L/U korrekt ab und bleibt PDF-tauglich.

**Werkstatt-Nutzen (Meister):** provisorischer Materialauszug
(Pfosten/Handläufe je Segment/Füllung mit Stückzahlen und Zuschnittlängen)
direkt in der Zusammenfassung — Vorstufe der Stückliste, klar als
TESTDATEN/provisorisch markiert.

## Grenzen (unverändert verbindlich)

Alle Regelparameter (Pfostenabstand, Stab-/Lagenabstände, Grenzmasse,
Glas-Pfostenabstand, Bodenfreiheit) sind TESTDATEN mit
`approval: fachliche Freigabe erforderlich`; Validierung bleibt maximal
GELB, Preisausgabe «Individuelle Prüfung», bis Gate C freigibt.
Marktwerte (z. B. SIA-Verweise der Konkurrenz) werden dokumentiert,
aber nie ungeprüft übernommen.
