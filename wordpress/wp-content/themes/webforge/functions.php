<?php
/**
 * Theme WebForge – schlankes Block-Theme.
 *
 * Enthält bewusst wenig Logik: Inhaltstypen, API und Fachlogik
 * liegen im Plugin webforge-core (siehe docs/architecture.md).
 */

// ----------------------------------------------------------------
// Kinder-Erklärung: Ein Theme ist das Kleid der Webseite – es
// bestimmt, wie alles aussieht. Diese Datei ist das Helferheft des
// Kleides. Die schwere Arbeit (Schubladen, Briefkasten) macht das
// Plugin webforge-core, damit beim Kleiderwechsel nichts verloren geht.
// ----------------------------------------------------------------
// 🤧 Schnupfspruch: Es Theme ohni Logik isch wie-n-es Chleid ohni Sack –
//    schön aazluege, und de Schnupf treit mer halt im Plugin-Pack.

// Türsteher: ABSPATH gibt es nur, wenn WordPress selber diese Datei öffnet.
// Will jemand die Datei direkt im Browser aufrufen, sagt der Türsteher
// «Stopp!» (exit) – so kann niemand an WordPress vorbei hineinschleichen.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Hook-Anmeldung: Wenn das Theme eingerichtet wird, laden wir sein
// Wörterbuch (Textdomain), damit Texte übersetzt werden können.
add_action(
	'after_setup_theme',
	static function () {
		load_theme_textdomain( 'webforge', get_template_directory() . '/languages' );
	}
);

// Hook-Anmeldung: Wenn WordPress die Seite anzieht (wp_enqueue_scripts),
// hängen wir unser Stylesheet (style.css) an. Die Versionsnummer hinten
// sorgt dafür, dass Browser nach einem Update das neue Kleid holen.
// 🤧 Schnupfspruch: Textdomain glade, Stylesheet dra –
//    jetzt hät s Theme sini Sunntigschleider aa.
add_action(
	'wp_enqueue_scripts',
	static function () {
		wp_enqueue_style(
			'webforge-style',
			get_stylesheet_uri(),
			array(),
			wp_get_theme()->get( 'Version' )
		);
	}
);
