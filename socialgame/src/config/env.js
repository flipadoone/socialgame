/** Configuração do ambiente (variáveis VITE_*; veja .env.example). */
const ENV = import.meta.env ?? globalThis.__NEMO_ENV__ ?? {};   // fora do Vite (testes em Node) usa __NEMO_ENV__
const trimSlash = value => String(value || '').replace(/\/+$/, '');

/** Backend Spring Boot (login, cadastro, validação de sessão). */
export const API_URL = trimSlash(ENV.VITE_API_URL || 'http://localhost:8080');

/** Incident Manager (Angular), aberto em iframe pelo Quadro de Avisos. */
export const INCIDENT_URL = trimSlash(ENV.VITE_ANGULAR_URL || 'http://localhost:4200');

/** Servidor multiplayer (WebSocket). Em produção, defina VITE_ROOM_WS_URL (wss://...). */
export const ROOM_WS_URL = ENV.VITE_ROOM_WS_URL ?? (ENV.DEV ? 'ws://localhost:8787' : '');

/** Chave PÚBLICA do canal Widget do TalkToMe (data-client-key). Não é a API Key secreta. */
export const TALKTOME_WIDGET_KEY = String(ENV.VITE_TALKTOME_WIDGET_KEY || '').trim();

export const ROOM_ID = ENV.VITE_ROOM_ID || 'nemolandia-main-room';

export function originOf(url) {
  try { return new URL(url).origin; } catch { return null; }
}
export const INCIDENT_ORIGIN = originOf(INCIDENT_URL);
