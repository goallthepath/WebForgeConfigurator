<?php
/**
 * Theme WebForge – schlankes Block-Theme.
 *
 * Enthält bewusst wenig Logik: Inhaltstypen, API und Fachlogik
 * liegen im Plugin webforge-core (siehe docs/architecture.md).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'after_setup_theme',
	static function () {
		load_theme_textdomain( 'webforge', get_template_directory() . '/languages' );
	}
);

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
