<?php
/**
 * REST-API der WebForge-Plattform, Namespace webforge/v1.
 *
 * Phase 0: nur Health-Endpunkt. Kataloge, Konfigurationen, Uploads und
 * Anfragen folgen in Phase 3–6 — jeweils mit serverseitiger Regel- und
 * Preisautorität (siehe ADR-003) und minimal öffentlicher Fläche
 * (siehe docs/security.md).
 */

// ----------------------------------------------------------------
// Kinder-Erklärung: Die REST-API ist wie ein Postschalter. Andere
// Programme (zum Beispiel der Konfigurator) werfen eine Frage in den
// Briefkasten und bekommen einen Antwortbrief zurück – nicht als
// schönes Papier, sondern als JSON (eine Art Einkaufszettel für Computer).
// ----------------------------------------------------------------

// Türsteher: ABSPATH gibt es nur, wenn WordPress selber diese Datei öffnet.
// Will jemand die Datei direkt im Browser aufrufen, sagt der Türsteher
// «Stopp!» (exit) – so kann niemand an WordPress vorbei hineinschleichen.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Die Hausnummer unseres Postschalters: webforge/v1.
// Das «v1» heisst Version 1 – kommt einmal ein neuer Schalter, heisst er v2.
const WEBFORGE_REST_NAMESPACE = 'webforge/v1';

// Hook-Anmeldung: Wenn WordPress den Postschalter aufmacht
// (rest_api_init), hängen wir unsere eigenen Briefkästen an die Wand.
// 🤧 Schnupfspruch: De Pöstler chunnt mit JSON statt mit Briefli –
//    «status ok», seit er, und schnupft es Priisli.
add_action(
	'rest_api_init',
	static function () {
		// Briefkasten «/health» = «Wie geht es dir?». Jeder darf fragen
		// (__return_true), aber nur lesen (READABLE), nichts hineinlegen.
		register_rest_route(
			WEBFORGE_REST_NAMESPACE,
			'/health',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				// Die Antwort: «Mir geht es gut (ok), ich bin webforge-core in Version …».
				// So merkt man schnell, ob der Server wach und gesund ist.
				// 🤧 Schnupfspruch: Health-Check am Morge, Health-Check znacht –
				//    de Server seit «ok», au wenn niemert lacht.
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
