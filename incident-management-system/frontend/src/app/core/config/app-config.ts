/**
 * Configuração central do frontend.
 *
 * - apiUrl: endereço do backend Spring Boot.
 * - gameOrigins: origens do jogo (NEMOLANDIA) autorizadas a embutir este app em iframe
 *   e a enviar a sessão por postMessage. Nunca use '*' como origem de destino.
 *
 * Em produção, troque pelos endereços HTTPS reais e mantenha em sincronia com o CORS do backend
 * (variável CORS_ALLOWED_ORIGINS) e com o cabeçalho frame-ancestors do nginx.
 */
export const APP_CONFIG = {
  apiUrl: 'http://localhost:8080',
  gameOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174'
  ]
} as const;
