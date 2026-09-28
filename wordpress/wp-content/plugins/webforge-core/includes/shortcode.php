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

// ----------------------------------------------------------------
// Kinder-Erklärung: Ein Shortcode ist ein Zauberwort in eckigen
// Klammern. Schreibt jemand [webforge_configurator] in eine Seite,
// zaubert WordPress an dieser Stelle ein Fenster (iframe) hinein,
// durch das man den Konfigurator sieht und bedienen kann.
// ----------------------------------------------------------------

// Türsteher: ABSPATH gibt es nur, wenn WordPress selber diese Datei öffnet.
// Will jemand die Datei direkt im Browser aufrufen, sagt der Türsteher
// «Stopp!» (exit) – so kann niemand an WordPress vorbei hineinschleichen.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Die Liste der Produkte, die das Zauberwort kennt. Alles andere
// wird ignoriert – so kann niemand Unsinn hineinschmuggeln.
// 🤧 Schnupfspruch: Gländer, Tor, Gitter und Stäge –
//    de Schmied macht alles, nume kei Rägebogeträge.
const WEBFORGE_PRODUCTS = array( 'gelaender', 'gartentor', 'fenstergitter', 'treppe' );

// Hook-Anmeldung: Hier bringen wir WordPress das Zauberwort bei.
// Die Funktion darunter wird jedes Mal gerufen, wenn es auf einer Seite steht.
add_shortcode(
	'webforge_configurator',
	static function ( $atts ) {
		// Standardwerte: Sagt der Redaktor nichts, gilt «kein Produkt,
		// keine Sprache, 900 Pixel hoch».
		$atts = shortcode_atts(
			array(
				'product' => '',
				'lang'    => '',
				'height'  => '900',
			),
			$atts,
			'webforge_configurator'
		);

		// Gibt es den fertig gebauten Konfigurator überhaupt? Wenn nicht,
		// zeigen wir nur dem Team einen Hinweis, wie man ihn baut.
		$index = WEBFORGE_CORE_DIR . 'configurator/index.html';
		if ( ! file_exists( $index ) ) {
			// Nur für Redaktionskonten sichtbar – Besucher sehen nichts Kaputtes.
			return current_user_can( 'edit_posts' )
				? '<p><strong>WebForge:</strong> ' . esc_html__( 'Konfigurator-Build fehlt. Bitte im Ordner configurator/ „npm run build:wp“ ausführen.', 'webforge-core' ) . '</p>'
				: '';
		}

		// Aufräumen und prüfen: nur erlaubte Produkte und Sprachen, und die
		// Höhe muss zwischen 400 und 3000 Pixel liegen – nicht winzig, nicht riesig.
		$product = in_array( $atts['product'], WEBFORGE_PRODUCTS, true ) ? $atts['product'] : '';
		$lang    = in_array( $atts['lang'], array( 'de', 'en' ), true ) ? $atts['lang'] : '';
		$height  = max( 400, min( 3000, absint( $atts['height'] ) ) );

		// Die Adresse fürs Fenster zusammenbauen: Wo liegt der Konfigurator,
		// welche Sprache, und hinter dem # welches Produkt gleich offen sein soll.
		$src = plugins_url( 'configurator/index.html', WEBFORGE_CORE_DIR . 'webforge-core.php' );
		if ( '' !== $lang ) {
			$src = add_query_arg( 'lang', $lang, $src );
		}
		$src .= '#/' . ( '' !== $product ? $product . '/' : '' );

		// Das Fenster (iframe) als HTML zurückgeben. esc_url und esc_attr
		// putzen die Werte, damit nichts Gefährliches in die Seite rutscht.
		// 🤧 Schnupfspruch: S iFrame isch es Fänschterli i d Werkstatt vom Schmied –
		//    me luegt dri, doch kei Funke flügt use i s Gmüet.
		return sprintf(
			'<iframe class="webforge-configurator" src="%1$s" title="%2$s" loading="lazy" style="width:100%%;height:%3$dpx;border:0;display:block"></iframe>',
			esc_url( $src ),
			esc_attr__( 'Produktkonfigurator', 'webforge-core' ),
			$height
		);
	}
);
