<?php
/**
 * Plugin Name: WebForge Local Mail (Mailpit)
 * Description: Leitet in der lokalen Entwicklungsumgebung allen E-Mail-Versand an Mailpit weiter. Wird nur bei WP_ENVIRONMENT_TYPE=local aktiv.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( 'local' !== wp_get_environment_type() ) {
	return;
}

add_action(
	'phpmailer_init',
	static function ( $phpmailer ) {
		$phpmailer->isSMTP();
		$phpmailer->Host     = 'mailpit';
		$phpmailer->Port     = 1025;
		$phpmailer->SMTPAuth = false;
	}
);
