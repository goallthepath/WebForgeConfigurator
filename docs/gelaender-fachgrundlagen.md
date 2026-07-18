# Fachgrundlagen Geländer (vom Auftraggeber geliefert, 2026-07-18)

Verbindliche fachliche Referenz für das Geländer-Modul. Kernaussage:

> Die BFU beschreibt das Schutzziel und sicherheitsrelevante Geometrien.
> SIA und Metaltec regeln Projektierung, Belastung, Bemessung, Befestigung
> und fachgerechte Ausführung.

## Quellen

- BFU-Fachdokumentation 2.003 «Geländer und Brüstungen» (Ausgabe 2020) —
  https://www.bfu.ch/de/ratgeber/gelaender-bruestungen
- BFU Rechtsfragen Geländer — https://www.bfu.ch/de/services/rechtsfragen/gelaender-vorschriften
- SIA 358:2010, SIA 261:2020 inkl. Korrigenda C2:2026 — https://shop.sia.ch
- Metaltec TR 001, TK 012, Merkblatt TK003 Verzinken

## BFU-Richtwerte (Planungsgrundsätze, KEINE Objektfreigabe)

| Thema | Richtwert |
| --- | --- |
| Schutzelement erforderlich | ab 1 m Absturzhöhe |
| Geländerhöhe Regelfall | ≥ 1,00 m (Treppenlauf ≥ 0,90 m) |
| Kinderschutz | bis 75 cm Höhe: 12-cm-Kugel darf nicht durchpassen |
| Lochfüllungen schwer bekletterbar | Öffnungen ≤ ca. 5 cm |
| Netze schwer bekletterbar | Maschenweite ≤ ca. 4 cm |
| Kletterwirkung | horizontale Traversen/Seile/Halter kritisch |
| Messbezug | ab begehbarer/besteigbarer Fläche (Vorsicht: Bank, Kiste, Belag) |

Kantonales/kommunales Baurecht kann strengere Anforderungen stellen.

## Konsequenzen für den Konfigurator (Abschnitt 8 der Grundlage)

**Kunde konfiguriert:** Einsatzort, Verlauf I/L/U, Masse, Füllungsfamilie
(Staketen/Blech/Gitter/Glas), Handlauf, Material/Oberfläche/Farbe,
Befestigungswunsch, Montage, Fotos.

**System leitet ab (provisorisch):** Feldaufteilung, Stückzahlen, Mengen,
Richtpreis, Warnungen zu Öffnungen/Kletterbarkeit, Ampel Grün/Gelb/Rot.

**Nur fachliche Prüfung entscheidet:** definitive Profilquerschnitte und
Pfostenabstände, Glasaufbau, Anker/Randabstände, Tragfähigkeit Baukörper,
Schweissnähte, Durchbiegung, lokales Baurecht, Statik-Freigabe,
Abdichtungs-/Fassadendetails.

→ Der Konfigurator ist Verkaufs-, Planungs- und Anfrageinstrument,
kein Ersatz für Werkplanung und Statik.

## Produktfamilien-Zielbild (Abschnitt 9)

| Familie | Konfigurierbarkeit | Status im Modul |
| --- | --- | --- |
| Vertikal (Staketen) | sehr hoch | umgesetzt |
| Fläche (Voll-/Loch-/Laserblech) | hoch | umgesetzt (Richtwert-Warnungen) |
| Gitter (Streckmetall/Draht) | hoch–mittel | umgesetzt (Richtwert-Warnungen) |
| Glas | mittel, Fachprüfung | umgesetzt (Prüfhinweise) |
| Charakter (geschmiedet) | Grundauswahl → individuell | Escape-Hatch zur Anfrage |
| Horizontalstab/Seil | projektspezifisch | wählbar mit Kletter-Warnung |
| Industrie (Knie-/Fussleiste, Suva) | eigenes Regelmodul | Escape-Hatch zur Anfrage |
| Treppengeländer | **eigener Konfigurator** | Escape-Hatch, Modul folgt separat |
| Bestand/Sanierung | geführte Anfrage | Escape-Hatch zur Anfrage |

## Regel-Einordnung im Code

- BFU-Richtwerte stehen als **quellenreferenzierte Konstanten**
  (`BFU_RICHTWERTE` in `rules/gelaender-rules.ts`) und erzeugen
  Warnungen/Sperren — die Objektfreigabe bleibt immer fachlich (max. GELB).
- Statikabhängige Werte (Pfostenabstände, Querschnitte) bleiben
  **TESTDATEN** bis Gate C — gemäss Grundlage dürfen sie nie allein aus
  Konfigurator-Tabellen stammen.
