<?php
/**
 * Plugin Name: WebForge Core
 * Description: Fachlogik der WebForge-Plattform: Inhaltstypen, Anfrageverwaltung, Konfigurationsspeicherung, REST-API (webforge/v1), Versionen, PDF und E-Mail.
 * Version: 0.1.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: goallthepath & Michl
 * License: MIT
 * Text Domain: webforge-core
 */

// ================================================================
// Hallo! Das hier ist die Hauptdatei vom Plugin «WebForge Core».
//
// Stell dir vor, WordPress ist ein grosser Schulordner voller Seiten.
// Ein Plugin ist ein Zusatz-Werkzeug, das man in den Werkzeugkasten
// von WordPress legt. Dieses Werkzeug bringt der Webseite bei, was eine
// Kunstschlosserei braucht: Schubladen für Leistungen und Referenzen,
// einen Briefkasten für Computer-Post (REST-API) und ein Zauberwort,
// das den Konfigurator für Geländer, Tore, Gitter und Treppen zeigt.
//
// Der Kommentar ganz oben (mit «Plugin Name:») ist das Namensschild.
// WordPress liest es, um das Plugin in seiner Liste anzuzeigen.
// ================================================================

// Türsteher: ABSPATH gibt es nur, wenn WordPress selber diese Datei öffnet.
// Will jemand die Datei direkt im Browser aufrufen, sagt der Türsteher
// «Stopp!» (exit) – so kann niemand an WordPress vorbei hineinschleichen.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Zwei feste Merkzettel (Konstanten), die sich nie ändern:
// die Versionsnummer und der Ordner, in dem dieses Plugin wohnt.
define( 'WEBFORGE_CORE_VERSION', '0.1.0' );
define( 'WEBFORGE_CORE_DIR', plugin_dir_path( __FILE__ ) );

// Das Plugin ist in mehrere Hefte aufgeteilt. Hier holen wir sie alle
// herbei, damit WordPress sie liest: Schubladen, Briefkasten, Zauberwort.

// 🤧 Schnupfspruch: Drü Hefter, ei Ordner, ei Plugin im Chaschte –
//    wer suuber sortiert, dä cha nachher raschte.
require_once WEBFORGE_CORE_DIR . 'includes/post-types.php';
require_once WEBFORGE_CORE_DIR . 'includes/rest-api.php';
require_once WEBFORGE_CORE_DIR . 'includes/shortcode.php';

// Wenn jemand das Plugin im Adminbereich EINschaltet (aktiviert):
// Zuerst bauen wir die Schubladen (Inhaltstypen), dann sagen wir
// WordPress «bitte die Wegweiser neu malen» (flush_rewrite_rules),
// damit Adressen wie /leistungen/ sofort funktionieren.
register_activation_hook(
	__FILE__,
	static function () {
		webforge_core_register_post_types();
		flush_rewrite_rules();
	}
);

// Wenn jemand das Plugin AUSschaltet: Wegweiser wieder neu malen,
// damit keine Schilder mehr auf Schubladen zeigen, die es nicht mehr gibt.
// 🤧 Schnupfspruch: Aktiviere, deaktiviere, d Rewrite-Regle spüele –
//    wie de Schmied d Esse putzt, bevor er afangt z wüele.
register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
