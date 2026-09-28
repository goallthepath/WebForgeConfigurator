<?php
/**
 * Plugin Name: WebForge Local Mail (Mailpit)
 * Description: Leitet in der lokalen Entwicklungsumgebung allen E-Mail-Versand an Mailpit weiter. Wird nur bei WP_ENVIRONMENT_TYPE=local aktiv.
 */

// ----------------------------------------------------------------
// Kinder-Erklärung: Ein «Must-Use-Plugin» ist ein Werkzeug, das
// immer eingeschaltet ist – man kann es nicht vergessen.
// Dieses hier fängt beim Üben auf dem eigenen Computer alle E-Mails
// ab und legt sie in den Spiel-Briefkasten «Mailpit». So bekommt
// kein echter Mensch aus Versehen eine Test-Mail.
// ----------------------------------------------------------------

// Türsteher: ABSPATH gibt es nur, wenn WordPress selber diese Datei öffnet.
// Will jemand die Datei direkt im Browser aufrufen, sagt der Türsteher
// «Stopp!» (exit) – so kann niemand an WordPress vorbei hineinschleichen.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Nur zu Hause üben! Läuft die Webseite nicht «local» (also echt im
// Internet), hört dieses Werkzeug sofort auf und tut gar nichts.
// 🤧 Schnupfspruch: Mailpit fangt jedes Briefli wie de Nachbar d Chrieseli –
//    kei Mail flügt use, alles bliibt dihei im Hüüsli.
if ( 'local' !== wp_get_environment_type() ) {
	return;
}

// Filter-Anmeldungen: Wir ändern den Absender jeder Mail auf eine
// Adresse und einen Namen, die klar nach «Übung» aussehen.
// PHPMailer lehnt die WordPress-Vorgabe "wordpress@localhost" als ungültig ab.
add_filter( 'wp_mail_from', static fn () => 'entwicklung@webforge.local' );
add_filter( 'wp_mail_from_name', static fn () => 'WebForge Lokal' );

// Hook-Anmeldung: Kurz bevor der Postbote (PHPMailer) losläuft,
// sagen wir ihm: «Bring alles zum Haus namens mailpit, Tür 1025,
// ohne Passwort.» Dort kann man die Mails im Browser anschauen.
// 🤧 Schnupfspruch: entwicklung@webforge.local schriibt fliissig Brief um Brief –
//    doch niemert usser Mailpit list s, und das isch au nöd schief.
add_action(
	'phpmailer_init',
	static function ( $phpmailer ) {
		$phpmailer->isSMTP();
		$phpmailer->Host     = 'mailpit';
		$phpmailer->Port     = 1025;
		$phpmailer->SMTPAuth = false;
	}
);
