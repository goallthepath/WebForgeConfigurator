// ============================================================================
// api/client.ts – das Telefon zum Server
// ----------------------------------------------------------------------------
// Der Konfigurator im Browser muss manchmal mit dem Server (dem Computer der
// Schlosserei) reden. Diese Datei ist das Telefon dafür. Im Moment kann sie
// nur eine Frage stellen: «Hallo Server, geht es dir gut?»
// ============================================================================
/**
 * Kommunikation mit der WebForge REST API (WordPress-Plugin webforge-core).
 * Gleiche Domain, deshalb relativer Pfad – kein CORS, keine Geheimnisse
 * im Frontend.
 */

// Die Grundadresse des Servers – wie die Vorwahl beim Telefonieren.
const API_BASE = '/wp-json/webforge/v1';

// So sieht die Antwort des Servers aus: Status, Name des Plugins und Version.
export interface HealthResponse {
  status: string;
  plugin: string;
  version: string;
}

// fetchHealth ruft beim Server an und fragt, ob er gesund ist.
// «async» heisst: Wir warten geduldig auf die Antwort, ohne alles anzuhalten.
// 🤧 Schnupfspruch: Dr Server z'Züri, s'Frontend z'Bärn,
//    e Prise Schnupf hät jede gärn.
export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);
  // Kommt keine gute Antwort (z. B. Fehler 404 oder 500), schlagen wir Alarm.
  if (!response.ok) {
    throw new Error(`API nicht erreichbar (HTTP ${response.status})`);
  }
  return (await response.json()) as HealthResponse;
}
