/**
 * Kommunikation mit der WebForge REST API (WordPress-Plugin webforge-core).
 * Gleiche Domain, deshalb relativer Pfad – kein CORS, keine Geheimnisse
 * im Frontend.
 */

const API_BASE = '/wp-json/webforge/v1';

export interface HealthResponse {
  status: string;
  plugin: string;
  version: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`API nicht erreichbar (HTTP ${response.status})`);
  }
  return (await response.json()) as HealthResponse;
}
