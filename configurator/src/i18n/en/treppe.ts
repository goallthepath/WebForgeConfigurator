// Für Kinder erklärt: Das ist ein Wörterbuch Deutsch → Englisch für die
// Treppen-Seite. Links steht der deutsche Satz, rechts derselbe Satz auf
// Englisch – so können auch Leute aus anderen Ländern ihre Treppe bestellen.
// 🤧 Schnupfspruch: Stäge heisst «stairs» und Handlauf «rail»,
//    doch Schnupf bliibt Schnupf – e Schwiizer Detail.
/** Englische Übersetzungen – Schlüssel ist der deutsche Originaltext. */
export const EN_TREPPE: Record<string, string> = {
  // Kopf
  '← Produktauswahl': '← Product selection',
  'Treppe & Treppengeländer konfigurieren': 'Configure stairs & stair railing',
  'Gerade, einläufige Stahltreppe – als komplette Treppe, als Geländer für Ihren Bestand oder kombiniert. Steigungsverhältnis nach Schrittmassregel, Geländer nach BFU-Richtwerten. Unser Meister prüft jede Konfiguration persönlich (Statik, Norm, Baurecht).':
    'Straight, single-flight steel staircase – as a complete stair, as a railing for your existing stair, or both combined. Rise/going ratio according to the step rule, railing according to BFU guidelines. Our master craftsman personally reviews every configuration (structural design, standards, building regulations).',

  // Schritt 1 – Umfang
  'Was möchten Sie?': 'What would you like?',
  'Umfang wählen': 'Choose scope',
  'Treppe + Geländer': 'Stairs + railing',
  'Komplette gerade Stahltreppe mit Treppengeländer.':
    'Complete straight steel staircase with stair railing.',
  'Nur Treppe': 'Stairs only',
  'Gerade Stahltreppe ohne Geländer (z. B. zwischen Wänden).':
    'Straight steel staircase without railing (e.g. between walls).',
  'Nur Treppengeländer': 'Stair railing only',
  'Geländer für Ihre bestehende Treppe – wir messen am Bestand.':
    'Railing for your existing staircase – we measure on site.',
  'Gewendelte, mehrläufige oder Podest-Treppen sowie Spindeltreppen plant unser Meister persönlich.':
    'Winder, multi-flight or landing staircases as well as spiral staircases are planned personally by our master craftsman.',

  // Schritt 2 – Nutzung
  Nutzung: 'Use',
  'Innen- oder Aussenbereich?': 'Indoors or outdoors?',
  'Sind Kinder zu erwarten?': 'Are children expected?',

  // Schritt 3 – Masse
  'Masse und Steigung': 'Dimensions and rise',
  'Geschosshöhe = Oberkante Fertigboden unten bis Oberkante Fertigboden oben. Wir rechnen das Steigungsverhältnis nach der Schrittmassregel (2×Steigung + Auftritt ≈ 630 mm).':
    'Floor-to-floor height = top of finished floor below to top of finished floor above. We calculate the rise/going ratio using the step rule (2 × rise + going ≈ 630 mm).',
  Geschosshöhe: 'Floor-to-floor height',
  Laufbreite: 'Stair width',
  Steigungen: 'Risers',
  '({n} Trittstufen)': '({n} treads)',
  'Steigung / Auftritt': 'Rise / going',
  Schrittmass: 'Step rule (2R+G)',
  '⚠ ausserhalb üblich': '⚠ outside usual range',
  'Lauflänge / Neigung': 'Run length / pitch',
  'Steigungen anpassen (optional)': 'Adjust number of risers (optional)',
  'Stk.': 'pcs',
  'Leer = automatisch nach Schrittmassregel.': 'Empty = automatic, based on the step rule.',
  'Meine Masse sind ungefähr (Aufmass nötig)':
    'My dimensions are approximate (site survey required)',

  // Schritt 4 – Werkstoff
  Werkstoff: 'Material',
  Stahl: 'Steel',
  Edelstahl: 'Stainless steel',
  'Rostfrei – ideal aussen.': 'Rust-free – ideal outdoors.',
  'Klassischer Schlosserstahl.': 'Classic metalworking steel.',
  TESTDATEN: 'TEST DATA',

  // Schritt 5 – Treppe
  Treppe: 'Stairs',
  'Wangenkonstruktion – die Tragfähigkeit wird statisch bemessen.':
    'Stringer construction – load-bearing capacity is structurally designed.',
  Konstruktion: 'Construction',
  Wangentreppe: 'Stringer staircase',
  'Zwei seitliche Wangen tragen die Stufen – der Klassiker.':
    'Two side stringers carry the treads – the classic.',
  Mittelholmtreppe: 'Mono-stringer staircase',
  'Ein zentraler Holm, frei auskragende Stufen – leicht und modern.':
    'A central spine with cantilevered treads – light and modern.',
  Stufenausführung: 'Tread type',
  Gitterrost: 'Grating',
  'Rutschhemmend und selbstreinigend – der Aussen-Klassiker.':
    'Slip-resistant and self-cleaning – the outdoor classic.',
  Tränenblech: 'Checker plate',
  'Geschlossene, profilierte Stahlstufe – robust.': 'Closed, textured steel tread – robust.',
  Glattblech: 'Smooth plate',
  'Glatte Stahlstufe – z. B. für Holz- oder Steinauflagen.':
    'Smooth steel tread – e.g. for timber or stone overlays.',
  'Steigungen (Setzstufen)': 'Risers',
  'Offene Steigungen': 'Open risers',
  'Luftig und leicht – Öffnungen werden nach BFU geprüft.':
    'Airy and light – openings are checked according to BFU.',
  'Geschlossene Setzstufen': 'Closed risers',
  'Blech-Setzstufen – geschlossen, kindersicher, aussen dicht.':
    'Sheet-metal risers – closed, child-safe, weather-tight outdoors.',
  'Holm-/Wangenmaterial (Vorschau)': 'Spine/stringer material (preview)',
  Wangenprofil: 'Stringer profile',

  // Schritt 6 – Geländer
  Treppengeländer: 'Stair railing',
  'BFU-Richtwert im Treppenlauf: mindestens 900 mm Geländerhöhe.':
    'BFU guideline on the flight: railing height at least 900 mm.',
  'Auf welcher Seite?': 'On which side?',
  Links: 'Left',
  'Geländer links (im Aufstieg gesehen).': 'Railing on the left (looking up the stairs).',
  Rechts: 'Right',
  'Geländer rechts (im Aufstieg gesehen).': 'Railing on the right (looking up the stairs).',
  Beidseitig: 'Both sides',
  'Geländer auf beiden Seiten.': 'Railing on both sides.',
  'Geländerhöhe (senkrecht über Stufenkante)': 'Railing height (vertically above tread nosing)',
  'BFU: mindestens 900 mm im Lauf; bei grosser Absturzhöhe mehr.':
    'BFU: at least 900 mm on the flight; more for large fall heights.',
  Füllung: 'Infill',
  'Staketen (senkrecht)': 'Balusters (vertical)',
  'Senkrechte Stäbe – kindersicher und zeitlos.': 'Vertical bars – child-safe and timeless.',
  'Querstäbe (Reling)': 'Horizontal rails (rail style)',
  'Schräg mitlaufende Stäbe – elegant, Kletter-Hinweis beachten.':
    'Rails running parallel to the pitch – elegant, note the climbing warning.',
  'Charakter (geschmiedet)': 'Character (wrought)',
  'Mit Schmiedeornamenten – Feinausarbeitung persönlich.':
    'With wrought-iron ornaments – detailing done personally.',
  'Ornament-Grundauswahl': 'Basic ornament selection',
  Pfosten: 'Posts',
  Handlauf: 'Handrail',
  Füllstäbe: 'Infill bars',
  Querstäbe: 'Horizontal rails',
  'Handlauf-Abschluss': 'Handrail end',

  // 🤧 Schnupfspruch: Uf Änglisch tönt's fein, uf Schwiizerdütsch warm –
  //    e Stäge us Iise, und de Schnupf unterem Arm.
  // Profile (Katalognamen ohne «TESTDATEN»-Präfix)
  'Wange Flachstahl 200×10': 'Stringer flat bar 200×10',
  'Wange Flachstahl 250×12 (kräftig)': 'Stringer flat bar 250×12 (heavy)',
  'Edelstahl-Wange Flachstahl 200×10': 'Stainless stringer flat bar 200×10',
  'Pfosten Quadratrohr 40': 'Post square tube 40',
  'Pfosten Quadratrohr 30 (leicht)': 'Post square tube 30 (light)',
  'Pfosten Rundrohr 42': 'Post round tube 42',
  'Pfosten T-Stahl 50': 'Post T-section 50',
  'Pfosten Flachstahl 60 (Schmiedeoptik)': 'Post flat bar 60 (wrought look)',
  'Edelstahl-Pfosten Quadratrohr 40': 'Stainless post square tube 40',
  'Edelstahl-Pfosten Rundrohr 42': 'Stainless post round tube 42',
  'Handlauf Rundrohr 42': 'Handrail round tube 42',
  'Handlauf Rundrohr 33 (schlank)': 'Handrail round tube 33 (slim)',
  'Handlauf Quadratrohr 40 (kantig)': 'Handrail square tube 40 (angular)',
  'Handlauf Flachprofil 40 (klassisch)': 'Handrail flat profile 40 (classic)',
  'Edelstahl-Handlauf Rundrohr 42': 'Stainless handrail round tube 42',
  'Edelstahl-Handlauf Rundrohr 33': 'Stainless handrail round tube 33',
  'Füllstab Rundstab 12': 'Infill bar round bar 12',
  'Füllstab Rundstab 14 (kräftig)': 'Infill bar round bar 14 (heavy)',
  'Füllstab Rundrohr 16 (leicht)': 'Infill bar round tube 16 (light)',
  'Füllstab Vierkantstab 12': 'Infill bar square bar 12',
  'Füllstab Vierkant gedreht (Schmiedeoptik)': 'Infill bar twisted square (wrought look)',
  'Füllstab Rechteckrohr 40×20': 'Infill bar rectangular tube 40×20',
  'Edelstahl-Füllstab Rundstab 12': 'Stainless infill bar round bar 12',
  'Edelstahl-Füllstab Vierkant 12': 'Stainless infill bar square 12',
  'Querstab Rundrohr 16 (Reling)': 'Horizontal rail round tube 16 (rail style)',
  'Querstab Rundstab 10 (fein)': 'Horizontal rail round bar 10 (fine)',
  'Querstab Flachstahl 30×6': 'Horizontal rail flat bar 30×6',
  'Edelstahl-Querstab Rundstab 12': 'Stainless horizontal rail round bar 12',
  'Edelstahl-Querstab Rundrohr 16': 'Stainless horizontal rail round tube 16',
  // Profilformen im Querschnittstext
  Rundrohr: 'Round tube',
  Quadratrohr: 'Square tube',
  Rechteckrohr: 'Rectangular tube',
  Flachstahl: 'Flat bar',
  Vierkantstab: 'Square bar',
  Rundstab: 'Round bar',
  'T-Stahl': 'T-section',
  Wand: 'wall',

  // Schritt 7 – Oberfläche
  'Oberfläche und Farbe': 'Finish and colour',
  Oberflächenbehandlung: 'Surface treatment',
  Pulverbeschichtet: 'Powder-coated',
  Feuerverzinkt: 'Hot-dip galvanized',
  'Geschliffen (Edelstahl, TESTDATEN)': 'Ground (stainless steel, TEST DATA)',
  'Gebürstet (Edelstahl, TESTDATEN)': 'Brushed (stainless steel, TEST DATA)',
  'Eignung wird fachlich geprüft.': 'Suitability is checked by our specialists.',
  Farbe: 'Colour',

  // Schritt 8 – Montage
  Montage: 'Installation',
  'Wer montiert?': 'Who installs it?',

  // Zusammenfassung
  'Ihre Konfiguration': 'Your configuration',
  'Geschosshöhe:': 'Floor-to-floor height:',
  '(ungefähr)': '(approximate)',
  'Steigungsverhältnis:': 'Rise/going ratio:',
  '({n} Stg.)': '({n} risers)',
  provisorisch: 'provisional',
  'Lauflänge:': 'Run length:',
  'Geländer:': 'Railing:',
  '{n} Pfosten/Seite': '{n} posts/side',
  'Materialauszug (provisorisch, für die Werkstatt)': 'Material list (provisional, for the workshop)',
  Position: 'Item',
  Länge: 'Length',
  'Noch keine Masse erfasst.': 'No dimensions entered yet.',
  'Bitte prüfen:': 'Please check:',
  'Konfiguration speichern (Link)': 'Save configuration (link)',
  'Übermittlung an die Werkstatt folgt mit dem Anfrage-System (Phase 3)':
    'Submission to the workshop will follow with the request system (phase 3)',
  'Offerte anfragen – folgt in Kürze': 'Request a quote – coming soon',
  Zurücksetzen: 'Reset',
  'Link kopiert – Konfiguration jederzeit wieder öffnen und teilen.':
    'Link copied – reopen and share the configuration at any time.',
  'Link:': 'Link:',
  Produkt: 'Product',
  Regeln: 'Rules',
  'Preis:': 'Price:',
  'keine Version (individuelle Prüfung)': 'no version (individual review)',
  Katalog: 'Catalogue',

  // Materialauszug
  Mittelholm: 'Central spine',
  Wangen: 'Stringers',
  'Trittstufen ({typ})': 'Treads ({typ})',
  'Typ offen': 'type not chosen',
  'Setzstufen (geschlossen)': 'Risers (closed)',
  'Handlauf (1 Seite)': 'Handrail (1 side)',
  'Handlauf ({n} Seiten)': 'Handrail ({n} sides)',
  Geländerpfosten: 'Railing posts',

  // Viewer
  'Treppenschnitt (Seitenansicht)': 'Stair section (side view)',
  Produktvorschau: 'Product preview',
  'Die 3D-Vorschau erscheint, sobald die Geschosshöhe erfasst ist.':
    'The 3D preview appears as soon as the floor-to-floor height is entered.',
  'Ansicht wählen': 'Choose view',
  Perspektive: 'Perspective',
  Seite: 'Side',
  Antritt: 'Bottom step',
  Schnitt: 'Section',
  Masslinien: 'Dimensions',
  '3D-Vorschau wird geladen …': 'Loading 3D preview …',
  'Ihr Gerät unterstützt kein 3D – der Schnitt zeigt Ihre Treppe massstäblich. Die Konfiguration funktioniert vollständig.':
    'Your device does not support 3D – the section shows your staircase to scale. The configuration works fully.',
  '{l} mm Lauf': '{l} mm run',

  // Regeln
  'Geschosshöhe {h} mm liegt unter dem Minimum von {min} mm.':
    'Floor-to-floor height {h} mm is below the minimum of {min} mm.',
  'Geschosshöhe {h} mm: Ein gerader Lauf braucht hier ein Zwischenpodest – bitte als individuelle Ausführung anfragen.':
    'Floor-to-floor height {h} mm: a straight flight needs an intermediate landing here – please request a custom design.',
  'Laufbreite {b} mm liegt ausserhalb des Bereichs {min}–{max} mm.':
    'Stair width {b} mm is outside the range {min}–{max} mm.',
  'Steigung {s} mm liegt ausserhalb {min}–{max} mm – Stufenzahl anpassen oder individuell planen.':
    'Rise {s} mm is outside {min}–{max} mm – adjust the number of steps or plan individually.',
  'Schrittmass {sm} mm liegt ausserhalb des üblichen Bereichs {min}–{max} mm – Gehkomfort wird fachlich geprüft.':
    'Step rule {sm} mm is outside the usual range {min}–{max} mm – walking comfort will be checked by our specialists.',
  'Auftritt {a} mm liegt ausserhalb des üblichen Bereichs – wird fachlich geprüft.':
    'Going {a} mm is outside the usual range – will be checked by our specialists.',
  'Treppengeländer: BFU-Richtwert mindestens {min} mm im Lauf – bitte Höhe anpassen.':
    'Stair railing: BFU guideline at least {min} mm on the flight – please adjust the height.',
  'Geländerhöhe {h} mm liegt ausserhalb des Vorschaubereichs.':
    'Railing height {h} mm is outside the preview range.',
  'Querstäbe wirken als Leiter – im Treppenbereich mit Kindern wird das Schutzziel oft nicht erreicht (BFU). Wir prüfen Alternativen.':
    'Horizontal rails act like a ladder – on stairs used by children the safety goal is often not met (BFU). We will check alternatives.',
  'Kinderschutz: Öffnungen werden nach BFU geprüft ({d}-mm-Kugel bis {z} mm).':
    'Child safety: openings are checked according to BFU ({d} mm sphere up to {z} mm).',
  'Glattes Blech aussen: Rutschhemmung wird fachlich beurteilt – Gitterrost oder Tränenblech sind aussen üblich.':
    'Smooth plate outdoors: slip resistance will be assessed by our specialists – grating or checker plate are usual outdoors.',
  'Geländer auf bestehende Treppe: Befestigung an Wange/Stufen und Zustand des Bestands werden beim Aufmass geprüft.':
    'Railing on an existing staircase: fixing to the stringer/treads and the condition of the existing stair are checked during the site survey.',
  'Ungefähre Masse: Vor der Fertigung wird vor Ort ausgemessen.':
    'Approximate dimensions: we will measure on site before fabrication.',
  'Charakter-Füllung: Ornament-Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich.':
    'Character infill: basic ornament selection – the detailed craftsmanship is planned personally by our master craftsman.',
  'Mittelholmtreppe: Holmquerschnitt und auskragende Stufen werden statisch bemessen – Darstellung ist Vorschau.':
    'Mono-stringer staircase: the spine cross-section and cantilevered treads are structurally designed – the display is a preview.',
  'Tragkonstruktion (Wangen, Stufen, Auflager) wird statisch bemessen – Profile hier sind Vorschau.':
    'The load-bearing structure (stringers, treads, supports) is structurally designed – profiles shown here are a preview.',
  'Offene Steigungen: Öffnungen werden kindersicher begrenzt (BFU, {d}-mm-Kugel) – ggf. mit Blenden.':
    'Open risers: openings are limited to be child-safe (BFU, {d} mm sphere) – with infill plates if necessary.',
  'Profil «{name}» ist nicht mehr verfügbar.': 'Profile «{name}» is no longer available.',
  'Profil «{name}» ist noch nicht fachlich freigegeben ({approval}).':
    'Profile «{name}» has not yet been approved by our specialists ({approval}).',
  'Die technischen Produktregeln (Abstände, Grenzmasse) sind noch nicht fachlich freigegeben – Stückzahlen und Masse in der Vorschau sind provisorisch. Unser Meister prüft jede Anfrage persönlich.':
    'The technical product rules (spacings, limit dimensions) have not yet been approved by our specialists – quantities and dimensions in the preview are provisional. Our master craftsman personally reviews every request.',
};
