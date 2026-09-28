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

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WEBFORGE_CORE_VERSION', '0.1.0' );
define( 'WEBFORGE_CORE_DIR', plugin_dir_path( __FILE__ ) );

require_once WEBFORGE_CORE_DIR . 'includes/post-types.php';
require_once WEBFORGE_CORE_DIR . 'includes/rest-api.php';
require_once WEBFORGE_CORE_DIR . 'includes/shortcode.php';

register_activation_hook(
	__FILE__,
	static function () {
		webforge_core_register_post_types();
		flush_rewrite_rules();
	}
);

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
