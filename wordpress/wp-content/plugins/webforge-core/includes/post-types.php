<?php
/**
 * Inhaltstypen der WebForge-Plattform (siehe docs/content-model.md).
 *
 * Registrierung im Plugin, nicht im Theme, damit Inhalte einen
 * Themewechsel überleben.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function webforge_core_register_post_types(): void {
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
	$internal_types = array(
		'webforge_material'      => array( __( 'Materialien', 'webforge-core' ), __( 'Material', 'webforge-core' ), true ),
		'webforge_oberflaeche'   => array( __( 'Oberflächen', 'webforge-core' ), __( 'Oberfläche', 'webforge-core' ), true ),
		'webforge_anfrage'       => array( __( 'Anfragen', 'webforge-core' ), __( 'Anfrage', 'webforge-core' ), false ),
		'webforge_konfiguration' => array( __( 'Konfigurationen', 'webforge-core' ), __( 'Konfiguration', 'webforge-core' ), false ),
	);

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

add_action( 'init', 'webforge_core_register_post_types' );
