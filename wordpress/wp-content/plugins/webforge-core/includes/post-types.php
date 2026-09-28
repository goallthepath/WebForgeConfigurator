<?php
/**
 * Inhaltstypen der WebForge-Plattform (siehe docs/content-model.md).
 *
 * Registrierung im Plugin, nicht im Theme, damit Inhalte einen
 * Themewechsel überleben.
 */

// ----------------------------------------------------------------
// Kinder-Erklärung: In diesem Heft bauen wir SCHUBLADEN für WordPress.
// Ein «Inhaltstyp» (Post Type) ist wie eine beschriftete Schublade im
// grossen WordPress-Schrank: eine für Leistungen, eine für Referenzen,
// eine für Wissensartikel – und ein paar geheime im Hinterzimmer.
// ----------------------------------------------------------------

// Türsteher: ABSPATH gibt es nur, wenn WordPress selber diese Datei öffnet.
// Will jemand die Datei direkt im Browser aufrufen, sagt der Türsteher
// «Stopp!» (exit) – so kann niemand an WordPress vorbei hineinschleichen.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Diese Funktion ist der Schreiner: Sie baut alle Schubladen auf einmal.
// «: void» heisst: Sie baut nur und gibt nichts zurück.
// 🤧 Schnupfspruch: Leistig, Referenz und Wüsse – drei Schublade im Schrank;
//    wer weiss, wo s Züüg liit, dä isch nie chrank.
function webforge_core_register_post_types(): void {
	// Die ÖFFENTLICHEN Schubladen: Alle Besucher dürfen hineinschauen.
	// Jede hat einen Namen (labels), eine Web-Adresse (rewrite/slug)
	// und eine Liste, was hinein darf (supports: Titel, Text, Bild …).
	$public_types = array(
		'webforge_leistung' => array(
			'labels'   => array(
				'name'          => __( 'Leistungen', 'webforge-core' ),
				'singular_name' => __( 'Leistung', 'webforge-core' ),
			),
			'rewrite'  => array( 'slug' => 'leistungen' ),
			'supports' => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
		),
		'webforge_referenz' => array(
			'labels'   => array(
				'name'          => __( 'Referenzen', 'webforge-core' ),
				'singular_name' => __( 'Referenz', 'webforge-core' ),
			),
			'rewrite'  => array( 'slug' => 'referenzen' ),
			'supports' => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
		),
		'webforge_wissen'   => array(
			'labels'   => array(
				'name'          => __( 'Wissen', 'webforge-core' ),
				'singular_name' => __( 'Wissensartikel', 'webforge-core' ),
			),
			'rewrite'  => array( 'slug' => 'wissen' ),
			'supports' => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
		),
	);

	// Jetzt bauen wir jede öffentliche Schublade wirklich. array_merge
	// mischt die Grundregeln (öffentlich, im Briefkasten sichtbar, mit
	// Archiv-Seite und Hammer-Symbol) mit den besonderen Angaben von oben.
	foreach ( $public_types as $type => $args ) {
		register_post_type(
			$type,
			array_merge(
				array(
					'public'       => true,
					'show_in_rest' => true,
					'has_archive'  => true,
					'menu_icon'    => 'dashicons-hammer',
				),
				$args
			)
		);
	}

	// Nicht öffentliche Typen: nur Backend und (teils) REST.
	// Kinder-Erklärung: Diese Schubladen stehen im Hinterzimmer der
	// Werkstatt. Nur das Team sieht sie im Adminbereich. Kundenanfragen
	// und gespeicherte Konfigurationen sind privat – darum steht dort
	// «false» und sie kommen NICHT in den Briefkasten (REST).
	// Die Reihenfolge in jeder Zeile: Mehrzahl, Einzahl, im Briefkasten ja/nein.
	// 🤧 Schnupfspruch: Hinder de Theke liit de Schnupf und s Material –
	//    de Chund gseht nume s Schaufänschter, und das isch ganz normal.
	$internal_types = array(
		'webforge_material'      => array( __( 'Materialien', 'webforge-core' ), __( 'Material', 'webforge-core' ), true ),
		'webforge_oberflaeche'   => array( __( 'Oberflächen', 'webforge-core' ), __( 'Oberfläche', 'webforge-core' ), true ),
		'webforge_anfrage'       => array( __( 'Anfragen', 'webforge-core' ), __( 'Anfrage', 'webforge-core' ), false ),
		'webforge_konfiguration' => array( __( 'Konfigurationen', 'webforge-core' ), __( 'Konfiguration', 'webforge-core' ), false ),
	);

	// Für jede geheime Schublade: auspacken (list) und bauen – nicht
	// öffentlich, nicht in der Suche, aber im Adminbereich sichtbar.
	foreach ( $internal_types as $type => list( $plural, $singular, $in_rest ) ) {
		register_post_type(
			$type,
			array(
				'labels'              => array(
					'name'          => $plural,
					'singular_name' => $singular,
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_rest'        => $in_rest,
				'exclude_from_search' => true,
				'supports'            => array( 'title', 'custom-fields' ),
				'menu_icon'           => 'dashicons-clipboard',
				'capability_type'     => 'post',
			)
		);
	}
}

// Hook-Anmeldung: «Liebes WordPress, wenn du am Morgen aufwachst (init),
// ruf bitte unseren Schreiner, damit alle Schubladen bereitstehen.»
add_action( 'init', 'webforge_core_register_post_types' );
