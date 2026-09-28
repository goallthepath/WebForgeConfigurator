<?php
/**
 * Shortcode [webforge_configurator] – bettet den Konfigurator in jede
 * beliebige Seite oder jeden Beitrag einer bestehenden WordPress-Website ein.
 *
 * Der Konfigurator läuft in einem iframe aus dem Plugin-Verzeichnis
 * (Build: `npm run build:wp`). Dadurch beeinflussen sich Theme-CSS und
 * Konfigurator nicht gegenseitig.
 *
 * Attribute:
 *   product  gelaender | gartentor | fenstergitter | treppe (leer = Produktauswahl)
 *   lang     de | en (leer = zuletzt gewählte Sprache des Besuchers, sonst de)
 *   height   Höhe des Rahmens in px (Standard 900)
 *
 * Beispiel: [webforge_configurator product="gartentor" lang="en" height="1000"]
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const WEBFORGE_PRODUCTS = array( 'gelaender', 'gartentor', 'fenstergitter', 'treppe' );

add_shortcode(
	'webforge_configurator',
	static function ( $atts ) {
		$atts = shortcode_atts(
			array(
				'product' => '',
				'lang'    => '',
				'height'  => '900',
			),
			$atts,
			'webforge_configurator'
		);

		$index = WEBFORGE_CORE_DIR . 'configurator/index.html';
		if ( ! file_exists( $index ) ) {
			// Nur für Redaktionskonten sichtbar – Besucher sehen nichts Kaputtes.
			return current_user_can( 'edit_posts' )
				? '<p><strong>WebForge:</strong> ' . esc_html__( 'Konfigurator-Build fehlt. Bitte im Ordner configurator/ „npm run build:wp“ ausführen.', 'webforge-core' ) . '</p>'
				: '';
		}

		$product = in_array( $atts['product'], WEBFORGE_PRODUCTS, true ) ? $atts['product'] : '';
		$lang    = in_array( $atts['lang'], array( 'de', 'en' ), true ) ? $atts['lang'] : '';
		$height  = max( 400, min( 3000, absint( $atts['height'] ) ) );

		$src = plugins_url( 'configurator/index.html', WEBFORGE_CORE_DIR . 'webforge-core.php' );
		if ( '' !== $lang ) {
			$src = add_query_arg( 'lang', $lang, $src );
		}
		$src .= '#/' . ( '' !== $product ? $product . '/' : '' );

		return sprintf(
			'<iframe class="webforge-configurator" src="%1$s" title="%2$s" loading="lazy" style="width:100%%;height:%3$dpx;border:0;display:block"></iframe>',
			esc_url( $src ),
			esc_attr__( 'Produktkonfigurator', 'webforge-core' ),
			$height
		);
	}
);
