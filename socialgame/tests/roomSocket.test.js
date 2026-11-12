import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inSeconds, makeJwt } from './helpers/jwt.js';

const SERVER = join(dirname(fileURLToPath(import.meta.url)), '..', 'server', 'roomServer.js');
const PORT = 19000 + Math.floor(Math.random() * 900);
const DIR = mkdtempSync(join(tmpdir(), 'nemo-e2e-'));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const until = async (condition, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (condition()) return true; await wait(25); }
  return false;
};

function startServer() {
  const proc = spawn('node', [SERVER], {
    env: {
      ...process.env, ROOM_BEAT_PORT: String(PORT), ROOM_JWT_SECRET: '', ROOM_ALLOWED_ORIGINS: '', ROOM_REQUIRE_AUTH: 'true',
      ROOM_DATA_FILE: join(DIR, 'layouts.json'), ROOM_CHAT_FILE: join(DIR, 'chat.json'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise(resolve => proc.stdout.once('data', () => resolve(proc)));
}

// Usa o roomSocket.js REAL do jogo (o mesmo que roda no navegador), com um "navegador" simulado.
test('cliente real do jogo: usuários diferentes conversam no mesmo chat universal', { skip: typeof WebSocket === 'undefined' && 'precisa de Node 22+ (WebSocket global)' }, async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  globalThis.__NEMO_ENV__ = { VITE_ROOM_WS_URL: `ws://localhost:${PORT}`, VITE_ROOM_ID: 'e2e' };

  const server = await startServer();
  try {
    const adminToken = makeJwt({ sub: 'ana@x.com', userId: 'u-ana', name: 'Ana', roles: ['ROLE_ADMIN'], exp: inSeconds(300) });
    const userToken = makeJwt({ sub: 'leo@x.com', userId: 'u-leo', name: 'Leo', roles: ['ROLE_USER'], exp: inSeconds(300) });

    // cada "navegador" = uma instância separada do módulo (o roomSocket guarda uma conexão por instância)
    async function openClient(tag, token) {
      store.set('habbo_jwt_token', token);                          // sessão deste usuário no momento do join
      const mod = await import(`../src/services/roomSocket.js?client=${tag}`);
      const conn = mod.acquireRoomSocket();
      const seen = { chat: [], system: [], players: [], layouts: [], welcome: null, history: null };
      conn.on('chat', m => seen.chat.push(m));
      conn.on('system', m => seen.system.push(m));
      conn.on('welcome', m => { seen.welcome = m; });
      conn.on('presence-snapshot', m => { seen.players = m.players; });
      conn.on('presence-join', m => seen.players.push(m.player));
      conn.on('room-layout', m => seen.layouts.push(m.objects));
      conn.on('chat-history', m => { seen.history = m.messages; });
      assert.ok(await until(() => seen.welcome), `${tag}: recebeu welcome`);
      return { mod, conn, seen };
    }

    const ana = await openClient('ana', adminToken);
    const leo = await openClient('leo', userToken);
    assert.equal(ana.seen.welcome.canEdit, true, 'admin é root');
    assert.equal(leo.seen.welcome.canEdit, false, 'jogador comum não edita');
    assert.ok(await until(() => ana.seen.players.some(p => p.name === 'Leo')), 'Ana vê Leo na sala');
    assert.ok(leo.seen.players.some(p => p.name === 'Ana' && p.isRoot), 'Leo vê Ana (root)');

    // Chat universal: o que um escreve, o outro recebe (e quem enviou também, com id do servidor)
    ana.conn.send('chat', { text: 'Oi, Leo!' });
    assert.ok(await until(() => leo.seen.chat.some(m => m.text === 'Oi, Leo!' && m.name === 'Ana' && m.isRoot)), 'Leo recebeu a mensagem da Ana');
    assert.ok(await until(() => ana.seen.chat.some(m => m.text === 'Oi, Leo!')), 'Ana recebeu o próprio eco');
    leo.conn.send('chat', { text: 'Olá, Ana!' });
    assert.ok(await until(() => ana.seen.chat.some(m => m.text === 'Olá, Ana!' && m.name === 'Leo' && !m.isRoot)), 'Ana recebeu a mensagem do Leo');

    // Quem entra depois vê o histórico, mesmo que os outros já tenham saído
    ana.conn.release(); leo.conn.release();
    await wait(300);
    const cris = await openClient('cris', makeJwt({ sub: 'cris@x.com', userId: 'u-cris', name: 'Cris', roles: ['ROLE_USER'], exp: inSeconds(300) }));
    assert.ok(await until(() => cris.seen.history), 'Cris recebeu o histórico');
    assert.deepEqual(cris.seen.history.map(m => m.text), ['Oi, Leo!', 'Olá, Ana!'], 'histórico mantido com a sala vazia');
    cris.conn.release();
  } finally {
    server.kill();
  }
});
