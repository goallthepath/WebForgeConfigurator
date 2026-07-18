<?php
/**
 * REST-API der WebForge-Plattform, Namespace webforge/v1.
 *
 * Phase 0: nur Health-Endpunkt. Kataloge, Konfigurationen, Uploads und
 * Anfragen folgen in Phase 3–6 — jeweils mit serverseitiger Regel- und
 * Preisautorität (siehe ADR-003) und minimal öffentlicher Fläche
 * (siehe docs/security.md).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const WEBFORGE_REST_NAMESPACE = 'webforge/v1';

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			WEBFORGE_REST_NAMESPACE,
			'/health',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response(
						array(
							'status'  => 'ok',
							'plugin'  => 'webforge-core',
							'version' => WEBFORGE_CORE_VERSION,
						)
					);
				},
			)
		);
	}
);
