# ADR-002: Versionierte Produktdaten mit Standardprofil-Katalog

Status: Angenommen (verbindliche Vorgabe des Bauplans) · Datum: 2026-07-18

## Kontext

Drei Produktmodule (Geländer, Gartentor, Fenstergitter) teilen sich Profile,
Materialien, Oberflächen, Farben, Regeln und Preise. Konfigurationen müssen
Jahre später reproduzierbar bleiben, auch wenn Kataloge ändern.

## Entscheidung

- Produktdaten leben als **JSON-Kataloge** unter `product-data/` mit
  JSON-Schemas unter `product-data/schemas/`. Sie sind **entwicklerverwaltet
  und versioniert** (semantische Versionen pro Produkt-, Regel- und Preisstand).
- **Kein Bauteil ohne `profileId`** aus dem freigegebenen Profilkatalog.
  Dieselbe `profileId` steuert 3D, Masse, Gewicht, Oberfläche, Preis, Regeln,
  PDF und spätere Stückliste. Freigaben gelten je Produkt und Bauteilrolle.
- Fachlich nicht freigegebene Werte tragen die Markierung
  `"approval": "fachliche Freigabe erforderlich"` und dürfen nicht produktiv
  wirksam werden. Testdaten sind mit `TESTDATEN` gekennzeichnet.
- Jede gespeicherte Konfiguration friert `productVersion`, `ruleVersion`
  und `priceVersion` ein; Neuberechnungen alter Anfragen verwenden die
  eingefrorenen Versionen.
- Der Meister pflegt im Backend nur unkritische Werte (Farben aktiv/inaktiv,
  einfache Preiswerte, Bilder). Strukturelle Konstruktionsregeln bleiben in
  der ersten Version im Repository.

## Konsequenzen

- Katalogänderungen sind Code-Reviews unterworfen und erzeugen neue Versionen.
- Der Server importiert denselben Katalogstand wie das Frontend
  (eine Quelle, zwei Konsumenten) — Abweichung ist ein Testfall.
