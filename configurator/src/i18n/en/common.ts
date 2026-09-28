// ============================================================================
// i18n/en/common.ts – das allgemeine englische Wörterbuch
// ----------------------------------------------------------------------------
// Hier stehen Übersetzungen, die überall gebraucht werden: Kopfzeile, Ampel,
// Preisvorschau, Werkstoffe, Oberflächen und Profilnamen. Links (vor dem
// Doppelpunkt) steht der deutsche Originalsatz, rechts die englische Fassung –
// genau wie in einem Taschenwörterbuch für die Ferien.
// ============================================================================

// 🤧 Schnupfspruch: Hochdütsch ine, Änglisch use,
//    dr Schnupf bliibt Schwiizerdütsch – im ganze Huse.
/** Englische Übersetzungen – Schlüssel ist der deutsche Originaltext. */
export const EN_COMMON: Record<string, string> = {
  // App-Rahmen und Startseite
  'Musterschlosserei – Konfigurator': 'Musterschlosserei – Configurator',
  'Seite nicht gefunden': 'Page not found',
  'Zur Produktauswahl': 'Back to product selection',
  'Was möchten Sie konfigurieren?': 'What would you like to configure?',
  'Stellen Sie Ihr Wunschprodukt zusammen und erhalten Sie eine unverbindliche Offertanfrage.':
    'Put together your product and send us a non-binding quote request.',
  'Geländer konfigurieren': 'Configure a railing',
  'Gerades oder L-förmiges Geländer mit definierten Pfosten, Füllungen, Handläufen und Befestigungsarten.':
    'Straight or L-shaped railing with defined posts, infills, handrails and mounting types.',
  'Gartentor konfigurieren': 'Configure a garden gate',
  'Ein- oder zweiflügeliges Metalltor mit Standardrahmen, Füllung, Pfosten und Beschlägen.':
    'Single or double-leaf metal gate with standard frame, infill, posts and hardware.',
  'Fenstergitter konfigurieren': 'Configure a window grille',
  'Fest montiertes Fenstergitter mit definiertem Rahmen, Stabanordnung, Oberfläche und Befestigung.':
    'Fixed window grille with defined frame, bar layout, finish and mounting.',
  'Treppe & Treppengeländer': 'Stairs & stair railing',
  'Gerade Stahltreppe, Treppengeländer für bestehende Läufe – oder beides kombiniert.':
    'Straight steel staircase, a railing for an existing flight – or both combined.',

  // Gemeinsame UI-Bausteine
  'Wird freigeschaltet, sobald der vorherige Schritt beantwortet ist.':
    'Unlocks as soon as the previous step is answered.',

  // Preisvorschau
  'Individuelle Prüfung: Unser Meister prüft Ihre Anfrage persönlich und erstellt eine Offerte.':
    'Individual review: our master craftsman checks your request personally and prepares a quote.',
  'Preisspanne: CHF {min} – {max} (Richtwert, Offerte nach persönlicher Prüfung).':
    'Price range: CHF {min} – {max} (guide value, quote after personal review).',
  'Richtpreis: CHF {min} (Richtwert, Offerte nach persönlicher Prüfung).':
    'Guide price: CHF {min} (guide value, quote after personal review).',

  // Testdaten-Kennzeichnung und Freigabestatus
  TESTDATEN: 'TEST DATA',
  freigegeben: 'approved',
  'fachliche Freigabe erforderlich': 'professional approval required',

  // Ampel / Regelprüfung
  Grün: 'Green',
  Gelb: 'Yellow',
  Rot: 'Red',
  'Fachprüfung erforderlich': 'Professional review required',
  'Profil «{name}» ist nicht mehr verfügbar.': 'Profile «{name}» is no longer available.',
  'Profil «{name}» ist noch nicht fachlich freigegeben ({approval}).':
    'Profile «{name}» has not yet been approved by our specialists ({approval}).',
  'Die technischen Produktregeln sind noch nicht fachlich freigegeben – jede Anfrage wird persönlich geprüft.':
    'The technical product rules have not yet been professionally approved – every request is reviewed personally.',
  'Es liegt noch keine freigegebene Preisversion vor.': 'No approved price version is available yet.',

  // Masszeichnung
  'Masszeichnung des Geländers (abgewickelte Frontansicht)':
    'Dimensioned drawing of the railing (unfolded front elevation)',

  // Werkstoffe (product-data/materials)
  Stahl: 'Steel',
  Edelstahl: 'Stainless steel',
  Aluminium: 'Aluminium',

  // Oberflächen (product-data/finishes)
  Pulverbeschichtet: 'Powder-coated',
  Feuerverzinkt: 'Hot-dip galvanised',
  Verzinkt: 'Galvanised',
  verzinkt: 'galvanised',
  pulverbeschichtet: 'powder-coated',
  feuerverzinkt: 'hot-dip galvanised',
  'feuerverzinkt + pulverbeschichtet': 'hot-dip galvanised + powder-coated',
  'Feuerverzinkt + pulverbeschichtet': 'Hot-dip galvanised + powder-coated',
  Geschliffen: 'Ground finish',
  Gebürstet: 'Brushed',
  'Geschliffen (Edelstahl)': 'Ground finish (stainless steel)',
  'Gebürstet (Edelstahl)': 'Brushed (stainless steel)',

  // Querschnitte (crossSectionLabel)
  Rundrohr: 'Round tube',
  Quadratrohr: 'Square tube',
  Vierkantrohr: 'Square tube',
  Rechteckrohr: 'Rectangular tube',
  Flachstahl: 'Flat bar',
  Vierkantstab: 'Square bar',
  Vierkantstahl: 'Square bar',
  Rundstab: 'Round bar',
  Rundstahl: 'Round bar',
  'T-Stahl': 'T-section',
  'Wand {t} mm': 'wall {t} mm',

  // Profilnamen (product-data/fixtures/test-profiles.json, ohne «TESTDATEN»-Präfix)
  'Edelstahl-Füllstab Rundstab 12': 'Stainless steel baluster, round bar 12',
  'Edelstahl-Füllstab Vierkant 12': 'Stainless steel baluster, square 12',
  'Edelstahl-Handlauf Rundrohr 33': 'Stainless steel handrail, round tube 33',
  'Edelstahl-Handlauf Rundrohr 42': 'Stainless steel handrail, round tube 42',
  'Edelstahl-Pfosten Quadratrohr 40': 'Stainless steel post, square tube 40',
  'Edelstahl-Pfosten Rundrohr 42': 'Stainless steel post, round tube 42',
  'Edelstahl-Querstab Rundrohr 16': 'Stainless steel horizontal rail, round tube 16',
  'Edelstahl-Querstab Rundstab 12': 'Stainless steel horizontal rail, round bar 12',
  'Edelstahl-Rahmen Rechteckrohr 40×20': 'Stainless steel frame, rectangular tube 40×20',
  'Edelstahl-Wange Flachstahl 200×10': 'Stainless steel stringer, flat bar 200×10',
  'Füllstab Rechteckrohr 40×20': 'Baluster, rectangular tube 40×20',
  'Füllstab Rundrohr 16 (leicht)': 'Baluster, round tube 16 (light)',
  'Füllstab Rundstab 12': 'Baluster, round bar 12',
  'Füllstab Rundstab 14 (kräftig)': 'Baluster, round bar 14 (heavy)',
  'Füllstab Vierkant gedreht (Schmiedeoptik)': 'Baluster, twisted square (wrought-iron look)',
  'Füllstab Vierkantstab 12': 'Baluster, square bar 12',
  'Handlauf Flachprofil 40 (klassisch)': 'Handrail, flat section 40 (classic)',
  'Handlauf Quadratrohr 40 (kantig)': 'Handrail, square tube 40 (angular)',
  'Handlauf Rundrohr 33 (schlank)': 'Handrail, round tube 33 (slim)',
  'Handlauf Rundrohr 42': 'Handrail, round tube 42',
  'Inaktives Profil (für Abweisungstests)': 'Inactive profile (for rejection tests)',
  'Ober-/Untergurt Flachstahl 40×10': 'Top/bottom rail, flat bar 40×10',
  'Pfosten Flachstahl 60 (Schmiedeoptik)': 'Post, flat bar 60 (wrought-iron look)',
  'Pfosten Quadratrohr 30 (leicht)': 'Post, square tube 30 (light)',
  'Pfosten Quadratrohr 40': 'Post, square tube 40',
  'Pfosten Rundrohr 42': 'Post, round tube 42',
  'Pfosten T-Stahl 50': 'Post, T-section 50',
  'Querstab Flachstahl 30×6': 'Horizontal rail, flat bar 30×6',
  'Querstab Rundrohr 16 (Reling)': 'Horizontal rail, round tube 16 (ship-rail style)',
  'Querstab Rundstab 10 (fein)': 'Horizontal rail, round bar 10 (fine)',
  'Rahmen Rechteckrohr 40×20': 'Frame, rectangular tube 40×20',
  'Wange Flachstahl 200×10': 'Stringer, flat bar 200×10',
  'Wange Flachstahl 250×12 (kräftig)': 'Stringer, flat bar 250×12 (heavy)',
};
// 🤧 Schnupfspruch: S'Wörterbuech weiss, was «Treppe» heisst,
//    doch nid, wie fein e Prise beisst.
