import { ROOM_ID, ROOM_WS_URL } from '../config/env.js';
import { getValidSessionToken } from './authService.js';

/**
 * Uma única conexão WebSocket com o servidor da sala, compartilhada por beat, presença,
 * layout e chat. Cada hook chama acquireRoomSocket() e devolve com release(); a conexão
 * fecha quando ninguém a usa. Reconecta com espera exponencial.
 *
 * status: 'offline' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'unauthorized'
 */
export { ROOM_ID };
export const isRoomServerConfigured = () => !!ROOM_WS_URL;

const CLOSE_UNAUTHORIZED = 4401;

let socket = null;
let refs = 0;
let attempt = 0;
let reconnectTimer = null;
let status = 'offline';
const handlers = new Map();      // tipo -> Set<fn>
const statusHandlers = new Set();

function setStatus(next) {
  if (next === status) return;
  status = next;
  statusHandlers.forEach(fn => fn(next));
}

function sendRaw(type, payload = {}) {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify({ type, roomId: ROOM_ID, ...payload }));
  return true;
}

function open() {
  if (!ROOM_WS_URL) return;
  setStatus(attempt ? 'reconnecting' : 'connecting');
  const ws = new WebSocket(ROOM_WS_URL);
  socket = ws;

  ws.addEventListener('open', () => {
    if (ws !== socket) return;
    attempt = 0;
    setStatus('connected');
    sendRaw('join', { token: getValidSessionToken() });
  });
  ws.addEventListener('message', event => {
    if (ws !== socket) return;
    try {
      const message = JSON.parse(event.data);
      handlers.get(message.type)?.forEach(fn => fn(message));
    } catch { /* ignora quadros inválidos */ }
  });
  ws.addEventListener('close', event => {
    if (ws !== socket) return;
    socket = null;
    if (refs === 0) { setStatus('offline'); return; }
    if (event.code === CLOSE_UNAUTHORIZED) { setStatus('unauthorized'); return; } // não adianta tentar de novo
    setStatus('disconnected');
    reconnectTimer = setTimeout(open, Math.min(15000, 1000 * 2 ** attempt++));
  });
  ws.addEventListener('error', () => ws.close());
}

function close() {
  clearTimeout(reconnectTimer);
  const ws = socket;
  socket = null;
  attempt = 0;
  ws?.close();
  setStatus('offline');
}

/** Tenta reconectar agora (botão "Reconectar"), sem esperar o próximo intervalo automático. */
export function reconnectRoomSocket() {
  if (refs === 0 || !ROOM_WS_URL) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  clearTimeout(reconnectTimer);
  attempt = 0;
  open();
}

export function acquireRoomSocket() {
  refs += 1;
  if (refs === 1) open();
  let released = false;
  return {
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
      return () => handlers.get(type)?.delete(fn);
    },
    onStatus(fn) {
      statusHandlers.add(fn);
      fn(status);
      return () => statusHandlers.delete(fn);
    },
    send: sendRaw,
    release() {
      if (released) return;
      released = true;
      refs -= 1;
      if (refs === 0) close();
    },
  };
}
