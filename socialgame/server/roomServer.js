/**
 * Servidor da sala (WebSocket) do NEMOLANDIA: autenticação, presença, chat, skins, layout e beat.
 *
 * Autenticação: valida o MESMO JWT emitido pelo backend Spring (assinatura HS256/HS384/HS512 e
 * expiração). O nome vem do token (não dá para se passar por outra pessoa) e ROLE_ADMIN = root.
 * Configure ROOM_JWT_SECRET (ou JWT_SECRET) igual ao JWT_SECRET do backend.
 *
 * Protocolo (JSON). Cliente -> servidor:
 *   join { roomId, token }                  entra (ou reentra) na sala
 *   presence { x, y, dir, isWalking, isSitting }
 *   skin { skin }                           preset ({id,kind:'preset'}) ou custom (com imagens PNG)
 *   chat { text }
 *   beat-state { state }                    só root
 *   room-layout { objects }                 só root
 * Servidor -> cliente:
 *   welcome { id, canEdit } | presence-snapshot { players } | presence-join { player }
 *   presence-update { id, ... } | presence-leave { id }
 *   chat-history { messages } | chat { ... } | system { ... }
 *   beat-state { state } | room-layout { objects|null } | error { code }
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

// Lê o .env do jogo (sem sobrescrever variáveis já definidas no ambiente), para que
// ROOM_JWT_SECRET, ROOM_ALLOWED_ORIGINS etc. valham também ao rodar `npm run server`.
try { process.loadEnvFile?.(join(dirname(fileURLToPath(import.meta.url)), '..', '.env')); } catch { /* sem .env */ }

// Mesmo valor padrão de desenvolvimento do backend (application.yml). TROQUE em produção.
const DEV_SECRET = 'viaappia-incident-management-system-secret-key-minimum-32-characters';
const SECRET = process.env.ROOM_JWT_SECRET || process.env.JWT_SECRET || DEV_SECRET;
const REQUIRE_AUTH = process.env.ROOM_REQUIRE_AUTH !== 'false';
const PORT = Number(process.env.ROOM_BEAT_PORT || 8787);
const ALLOWED_ORIGINS = (process.env.ROOM_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

const ROOT_ROLE = 'ROLE_ADMIN';
const MAX_MSGS_PER_SEC = 30;
const MAX_PLAYERS_PER_ROOM = 40;
const MAX_GRID = 20;                 // a sala é 9x9; margem para crescer
const MAX_OBJECTS = 150;
const CHAT_MAX_LENGTH = 200;
const CHAT_HISTORY = 50;
const CHAT_WINDOW_MS = 6000;
const CHAT_MAX_PER_WINDOW = 5;
const MAX_SPRITE_CHARS = 90000;
const MAX_SKIN_CHARS = 400000;
const CLOSE_UNAUTHORIZED = 4401;

const DATA_FILE = process.env.ROOM_DATA_FILE || join(dirname(fileURLToPath(import.meta.url)), 'data', 'room-layouts.json');
const CHAT_FILE = process.env.ROOM_CHAT_FILE || join(dirname(DATA_FILE), 'chat-history.json');

// ---------- persistência do layout ----------
let savedLayouts = {};
try { if (existsSync(DATA_FILE)) savedLayouts = JSON.parse(readFileSync(DATA_FILE, 'utf8')); }
catch (error) { console.warn('Não foi possível ler room-layouts.json:', error.message); }

// Histórico do chat: as últimas mensagens ficam salvas, então quem entra depois (ou com a sala vazia)
// ainda vê a conversa. Só mensagens de jogadores são guardadas (avisos de entrada/saída não).
let savedChats = {};
try {
  if (existsSync(CHAT_FILE)) {
    const raw = JSON.parse(readFileSync(CHAT_FILE, 'utf8'));
    for (const [roomId, list] of Object.entries(raw)) {
      savedChats[roomId] = (Array.isArray(list) ? list : [])
        .filter(m => m && typeof m.id === 'string' && typeof m.text === 'string' && typeof m.name === 'string' && Number.isFinite(m.ts))
        .slice(-CHAT_HISTORY);
    }
  }
} catch (error) { console.warn('Não foi possível ler chat-history.json:', error.message); }

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      mkdirSync(dirname(DATA_FILE), { recursive: true });
      writeFileSync(DATA_FILE, JSON.stringify(savedLayouts));
      mkdirSync(dirname(CHAT_FILE), { recursive: true });
      writeFileSync(CHAT_FILE, JSON.stringify(savedChats));
    } catch (error) { console.error('Falha ao salvar dados da sala:', error.message); }
  }, 500);
}

// ---------- estado em memória ----------
const rooms = new Map();        // roomId -> { sockets:Set, beat, layout, history:[] }
const connections = new Map();  // socket -> { roomId, player, canEdit, exp, chatTimes:[] }

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    savedChats[roomId] ??= [];
    rooms.set(roomId, { sockets: new Set(), beat: null, layout: savedLayouts[roomId] ?? null, history: savedChats[roomId] });
  }
  return rooms.get(roomId);
}

const send = (socket, payload) => { if (socket.readyState === 1) socket.send(JSON.stringify(payload)); };
function broadcast(room, payload, except) {
  const packet = JSON.stringify(payload);
  for (const peer of room.sockets) if (peer !== except && peer.readyState === 1) peer.send(packet);
}
const newId = () => randomBytes(6).toString('hex');

// ---------- JWT ----------
const HASHES = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' };

/** Valida assinatura e expiração. Retorna as claims ou null. */
export function verifyJwt(token, secret = SECRET) {
  try {
    const [h, p, sig] = String(token).split('.');
    if (!h || !p || !sig) return null;
    const hash = HASHES[JSON.parse(Buffer.from(h, 'base64url').toString()).alg];
    if (!hash) return null; // rejeita "none" e algoritmos não previstos
    const expected = createHmac(hash, secret).update(`${h}.${p}`).digest();
    const given = Buffer.from(sig, 'base64url');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) return null;
    return claims;
  } catch { return null; }
}

// ---------- validação ----------
const cleanText = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
function validSprite(value) {
  if (typeof value !== 'string' || value.length > MAX_SPRITE_CHARS || !PNG_DATA_URL.test(value)) return false;
  return Buffer.from(value.slice(22, 34), 'base64').subarray(0, 8).toString('hex') === '89504e470d0a1a0a'; // assinatura PNG
}

function sanitizeSkin(skin) {
  if (!skin || typeof skin !== 'object') return null;
  if (skin.kind === 'preset') return /^[a-z0-9-]{1,24}$/.test(skin.id) ? { id: skin.id, kind: 'preset' } : null;
  if (skin.kind !== 'custom' || !skin.images || typeof skin.images !== 'object') return null;

  const images = {};
  let total = 0;
  const take = value => { if (!validSprite(value)) return false; total += value.length; return true; };
  if (skin.images.single != null) { if (!take(skin.images.single)) return null; images.single = skin.images.single; }
  for (const group of ['idle', 'walk']) {
    const source = skin.images[group];
    if (source == null) continue;
    if (typeof source !== 'object') return null;
    images[group] = {};
    for (const [dir, value] of Object.entries(source)) {
      if (!/^[0-7]$/.test(dir) || !take(value)) return null;
      images[group][dir] = value;
    }
  }
  if (total === 0 || total > MAX_SKIN_CHARS) return null;
  return { id: `custom-${cleanText(skin.id, 60).replace(/[^a-zA-Z0-9-]/g, '')}`, kind: 'custom', name: cleanText(skin.name, 24) || 'Skin', images };
}

function sanitizeLayout(objects) {
  if (!Array.isArray(objects) || objects.length > MAX_OBJECTS) return null;
  for (const obj of objects) {
    const pos = obj?.gridPosition;
    if (typeof obj?.id !== 'string' || obj.id.length > 100) return null;
    if (!pos || !Number.isInteger(pos.x) || !Number.isInteger(pos.y)) return null;
    if (pos.x < 0 || pos.y < 0 || pos.x >= MAX_GRID || pos.y >= MAX_GRID) return null;
    // Só sprites locais: impede imagens externas para todos os jogadores.
    if (typeof obj.sprite !== 'string' || !obj.sprite.startsWith('/assets/') || obj.sprite.includes('..')) return null;
  }
  return objects;
}

function sanitizeBeat(state) {
  return {
    isPlaying: Boolean(state.isPlaying),
    startedAt: state.isPlaying ? (Number(state.startedAt) || Date.now()) : null,
    bpm: Math.max(50, Math.min(200, Number(state.bpm) || 120)),
    masterVolume: Math.max(0, Math.min(1, Number(state.masterVolume) || 0)),
    isMuteAll: Boolean(state.isMuteAll),
    pattern: Array.isArray(state.pattern) ? state.pattern.slice(0, 5).map(row => Array.isArray(row) ? row.slice(0, 16).map(Boolean) : []) : [],
    mutes: Array.isArray(state.mutes) ? state.mutes.slice(0, 5).map(Boolean) : [],
    solos: Array.isArray(state.solos) ? state.solos.slice(0, 5).map(Boolean) : [],
  };
}

// ---------- ciclo de vida ----------
function remember(room, message) {
  room.history.push(message);
  if (room.history.length > CHAT_HISTORY) room.history.shift();
  persist();
}

function leave(socket) {
  const conn = connections.get(socket);
  if (!conn) return;
  connections.delete(socket);
  const room = rooms.get(conn.roomId);
  if (!room) return;
  room.sockets.delete(socket);
  broadcast(room, { type: 'presence-leave', id: conn.player.id });
  if (room.sockets.size) {
    broadcast(room, { type: 'system', id: newId(), text: `${conn.player.name} saiu da sala`, ts: Date.now() });
  } else {
    rooms.delete(conn.roomId); // layout e histórico do chat continuam salvos em disco
  }
}

function handleJoin(socket, message) {
  const roomId = /^[A-Za-z0-9_-]{1,64}$/.test(message.roomId || '') ? message.roomId : 'nemolandia-main-room';
  const claims = verifyJwt(message.token);

  if (!claims && REQUIRE_AUTH) {
    send(socket, { type: 'error', code: 'unauthorized' });
    socket.close(CLOSE_UNAUTHORIZED, 'unauthorized');
    return;
  }

  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const identity = {
    userId: String(claims?.userId ?? claims?.sub ?? `guest-${newId()}`),
    name: cleanText(claims?.name ?? claims?.sub, 24) || 'Visitante',
    isRoot: roles.includes(ROOT_ROLE),
    exp: typeof claims?.exp === 'number' ? claims.exp * 1000 : null,
  };

  let conn = connections.get(socket);
  const rejoin = conn && conn.roomId === roomId;
  if (rejoin) {                                   // reentrada: mantém o mesmo avatar
    Object.assign(conn.player, { name: identity.name, isRoot: identity.isRoot });
    conn.canEdit = identity.isRoot;
    conn.exp = identity.exp;
  } else {
    leave(socket);
    const room = getRoom(roomId);
    if (room.sockets.size >= MAX_PLAYERS_PER_ROOM) { send(socket, { type: 'error', code: 'room-full' }); return; }
    conn = {
      roomId, canEdit: identity.isRoot, exp: identity.exp, chatTimes: [],
      player: {
        id: newId(), userId: identity.userId, name: identity.name, isRoot: identity.isRoot,
        x: 1, y: 1, dir: 4, isWalking: false, isSitting: false, skin: null,
      },
    };
    connections.set(socket, conn);
    room.sockets.add(socket);
  }

  const room = getRoom(roomId);
  send(socket, { type: 'welcome', id: conn.player.id, canEdit: conn.canEdit });
  if (room.beat) send(socket, { type: 'beat-state', state: room.beat });
  send(socket, { type: 'room-layout', objects: room.layout });
  const others = [...room.sockets].filter(s => s !== socket).map(s => connections.get(s)?.player).filter(Boolean);
  send(socket, { type: 'presence-snapshot', players: others });
  send(socket, { type: 'chat-history', messages: room.history });
  if (!rejoin) {
    broadcast(room, { type: 'presence-join', player: conn.player }, socket);
    broadcast(room, { type: 'system', id: newId(), text: `${conn.player.name} entrou na sala`, ts: Date.now() }, socket);
  }
}

// ---------- servidor ----------
export function startServer(port = PORT) {
  const server = new WebSocketServer({
    port,
    maxPayload: 512 * 1024,
    verifyClient: ({ origin }) => !ALLOWED_ORIGINS.length || ALLOWED_ORIGINS.includes(origin),
  });

  server.on('connection', socket => {
    let windowStart = Date.now(), count = 0;
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });

    socket.on('message', raw => {
      const now = Date.now();
      if (now - windowStart > 1000) { windowStart = now; count = 0; }
      if (++count > MAX_MSGS_PER_SEC) return;

      let message;
      try { message = JSON.parse(raw.toString()); } catch { return; }
      if (!message || typeof message !== 'object') return;

      if (message.type === 'join') { handleJoin(socket, message); return; }

      const conn = connections.get(socket);
      if (!conn) return;                              // precisa entrar antes de qualquer outra coisa
      if (conn.exp && conn.exp <= now) { socket.close(CLOSE_UNAUTHORIZED, 'expired'); return; }
      const room = rooms.get(conn.roomId);
      if (!room) return;
      const p = conn.player;

      switch (message.type) {
        case 'presence':
          p.x = clampInt(message.x, 0, MAX_GRID - 1, p.x);
          p.y = clampInt(message.y, 0, MAX_GRID - 1, p.y);
          p.dir = clampInt(message.dir, 0, 7, p.dir);
          p.isWalking = Boolean(message.isWalking);
          p.isSitting = Boolean(message.isSitting);
          broadcast(room, { type: 'presence-update', id: p.id, x: p.x, y: p.y, dir: p.dir, isWalking: p.isWalking, isSitting: p.isSitting }, socket);
          break;

        case 'skin': {
          const skin = sanitizeSkin(message.skin);
          if (!skin) return;
          p.skin = skin;
          broadcast(room, { type: 'presence-update', id: p.id, skin }, socket);
          break;
        }

        case 'chat': {
          const text = cleanText(message.text, CHAT_MAX_LENGTH);
          if (!text) return;
          conn.chatTimes = conn.chatTimes.filter(t => now - t < CHAT_WINDOW_MS);
          if (conn.chatTimes.length >= CHAT_MAX_PER_WINDOW) { send(socket, { type: 'error', code: 'rate-limit' }); return; }
          conn.chatTimes.push(now);
          const entry = { type: 'chat', id: newId(), playerId: p.id, userId: p.userId, name: p.name, isRoot: p.isRoot, text, ts: now };
          remember(room, entry);
          broadcast(room, entry);                     // inclui quem enviou (eco com horário do servidor)
          break;
        }

        case 'beat-state':
          if (!conn.canEdit || !message.state) return;
          room.beat = sanitizeBeat(message.state);
          broadcast(room, { type: 'beat-state', state: room.beat }, socket);
          break;

        case 'room-layout': {
          const objects = conn.canEdit ? sanitizeLayout(message.objects) : null;
          if (!objects) { send(socket, { type: 'room-layout', objects: room.layout }); return; } // desfaz no cliente
          room.layout = objects;
          savedLayouts[conn.roomId] = objects;
          persist();
          broadcast(room, { type: 'room-layout', objects }, socket);
          break;
        }
        default:
      }
    });

    socket.on('close', () => leave(socket));
    socket.on('error', () => socket.terminate());
  });

  // Remove conexões mortas (queda de rede sem "close").
  const heartbeat = setInterval(() => {
    for (const socket of server.clients) {
      if (!socket.isAlive) { socket.terminate(); continue; }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30000);
  heartbeat.unref();
  server.on('close', () => clearInterval(heartbeat));
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
  console.log(`Servidor da sala ativo na porta ${PORT}`);
  if (SECRET === DEV_SECRET) console.warn('ATENÇÃO: usando o segredo JWT de DESENVOLVIMENTO. Defina ROOM_JWT_SECRET (igual ao JWT_SECRET do backend) em produção.');
  if (!REQUIRE_AUTH) console.warn('ATENÇÃO: ROOM_REQUIRE_AUTH=false — visitantes sem login podem entrar (somente leitura).');
}
