import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Segredo de desenvolvimento do backend (68 bytes => o jjwt assina em HS512, como os tokens reais).
const SECRET = 'viaappia-incident-management-system-secret-key-minimum-32-characters';
const SERVER = join(dirname(fileURLToPath(import.meta.url)), '..', 'server', 'roomServer.js');
const PORT = 18000 + Math.floor(Math.random() * 1000);
const DATA_FILE = join(mkdtempSync(join(tmpdir(), 'nemo-')), 'layouts.json');
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (payload, alg = 'HS512', secret = SECRET) => {
  const h = b64({ alg }), p = b64(payload);
  const hash = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' }[alg];
  return `${h}.${p}.${createHmac(hash, secret).update(`${h}.${p}`).digest('base64url')}`;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
function startServer() {
  const proc = spawn('node', [SERVER], { env: { ...process.env, ROOM_BEAT_PORT: String(PORT), ROOM_DATA_FILE: DATA_FILE, ROOM_CHAT_FILE: join(dirname(DATA_FILE), 'chat.json'), ROOM_JWT_SECRET: '', ROOM_ALLOWED_ORIGINS: '', ROOM_REQUIRE_AUTH: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise(resolve => proc.stdout.once('data', () => resolve(proc)));
}
function client() {
  const ws = new WebSocket(`ws://localhost:${PORT}`); const inbox = []; let closed = null;
  ws.onmessage = e => inbox.push(JSON.parse(e.data));
  ws.onclose = e => { closed = e.code; };
  return { ws, inbox, send: o => ws.send(JSON.stringify(o)), ready: new Promise(r => { ws.onopen = r; }),
    last: t => [...inbox].reverse().find(m => m.type === t), all: t => inbox.filter(m => m.type === t), closedCode: () => closed };
}

test('servidor da sala: autenticação, presença, chat, skins, permissões e persistência', async () => {
  const srv = await startServer();
  const results = [];
  const ok = (name, cond) => { results.push([name, !!cond]); };
const exp = s => Math.floor(Date.now() / 1000) + s;
const adminTok = jwt({ sub: 'admin@viaappia.com', userId: 'u1', name: 'Ana Admin', roles: ['ROLE_ADMIN'], exp: exp(60) });
const userTok  = jwt({ sub: 'leitor@viaappia.com', userId: 'u2', name: 'Leo Leitor', roles: ['ROLE_USER'], exp: exp(60) });


const root = client(), guest = client();
await Promise.all([root.ready, guest.ready]);

root.send({ type: 'join', roomId: 't', token: adminTok }); await wait(100);
ok('token HS512 real do backend é aceito; admin = root/canEdit', root.last('welcome')?.canEdit === true);
ok('sala nova sem layout salvo (null)', root.last('room-layout')?.objects === null);

const layout = [{ id: 'a', sprite: '/assets/desk.png', gridPosition: { x: 2, y: 2 } }];
root.send({ type: 'room-layout', objects: layout }); await wait(100);

guest.send({ type: 'join', roomId: 't', token: userTok }); await wait(150);
ok('ROLE_USER entra sem poder editar', guest.last('welcome')?.canEdit === false);
ok('jogador recebe o layout salvo pelo root', guest.last('room-layout')?.objects?.[0]?.id === 'a');
ok('nome vem do token (não do cliente)', root.last('presence-join')?.player?.name === 'Leo Leitor');
ok('snapshot mostra o root com estrela', guest.last('presence-snapshot')?.players?.[0]?.isRoot === true);
ok('aviso de entrada na sala', root.all('system').some(m => m.text.includes('Leo Leitor entrou')));

guest.send({ type: 'presence', x: 5, y: 6, dir: 2, isWalking: true, isSitting: false }); await wait(80);
const u = root.last('presence-update');
ok('movimento chega ao outro jogador', u && u.x === 5 && u.y === 6 && u.isWalking);
guest.send({ type: 'presence', x: 9999, y: -5, dir: 99 }); await wait(80);
const c = root.last('presence-update');
ok('coordenadas inválidas são limitadas', c.x === 19 && c.y === 0 && c.dir === 7);

// chat
guest.send({ type: 'chat', text: '  Olá\u0000   pessoal!  ' }); await wait(100);
const m = root.last('chat');
ok('chat chega a todos com nome verdadeiro', m?.name === 'Leo Leitor' && m.text === 'Olá pessoal!' && m.isRoot === false);
ok('quem enviou recebe o eco com id do servidor', guest.last('chat')?.id === m.id);
root.send({ type: 'chat', text: 'x'.repeat(500) }); await wait(80);
ok('mensagem é limitada a 200 caracteres', guest.last('chat').text.length === 200);
for (let i = 0; i < 6; i++) guest.send({ type: 'chat', text: `spam ${i}` });
await wait(150);
ok('flood de chat é bloqueado (rate limit)', guest.all('error').some(e => e.code === 'rate-limit'));

// skins
const png = 'data:image/png;base64,' + Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
guest.send({ type: 'skin', skin: { id: 'ocean', kind: 'preset' } }); await wait(80);
ok('skin preset sincroniza', root.last('presence-update')?.skin?.id === 'ocean');
guest.send({ type: 'skin', skin: { id: 'custom-abc', kind: 'custom', name: 'Minha', images: { single: png } } }); await wait(80);
ok('skin própria (PNG válido) sincroniza', root.last('presence-update')?.skin?.images?.single === png);
guest.send({ type: 'skin', skin: { id: 'custom-evil', kind: 'custom', name: 'x', images: { single: 'data:image/svg+xml;base64,PHN2Zz4=' } } }); await wait(80);
ok('skin com SVG/dado inválido é rejeitada', root.last('presence-update')?.skin?.id !== 'custom-evil');

// permissões
guest.send({ type: 'room-layout', objects: [{ id: 'hack', sprite: '/assets/x.png', gridPosition: { x: 1, y: 1 } }] }); await wait(80);
ok('jogador comum NÃO altera a sala (recebe o layout oficial de volta)', guest.last('room-layout')?.objects?.[0]?.id === 'a');
root.send({ type: 'room-layout', objects: [{ id: 'ext', sprite: 'https://evil.com/x.png', gridPosition: { x: 1, y: 1 } }] }); await wait(80);
ok('sprite externa rejeitada mesmo para root', root.last('room-layout')?.objects?.[0]?.id === 'a');
guest.send({ type: 'beat-state', state: { isPlaying: true } }); await wait(80);
ok('jogador comum não altera o beat', !root.last('beat-state'));
root.send({ type: 'beat-state', state: { isPlaying: true, bpm: 999, startedAt: 5 } }); await wait(80);
ok('root altera o beat (bpm limitado)', guest.last('beat-state')?.state?.bpm === 200);

// autenticação
const bad = client(); await bad.ready;
bad.send({ type: 'join', roomId: 't', token: jwt({ sub: 'x', roles: ['ROLE_ADMIN'], exp: exp(60) }, 'HS512', 'outro-segredo-qualquer-com-mais-de-32-bytes') }); await wait(150);
ok('token com assinatura falsa é recusado (4401)', bad.closedCode() === 4401 && bad.last('error')?.code === 'unauthorized');
const expired = client(); await expired.ready;
expired.send({ type: 'join', roomId: 't', token: jwt({ sub: 'x', roles: [], exp: exp(-10) }) }); await wait(150);
ok('token expirado é recusado', expired.closedCode() === 4401);
const none = client(); await none.ready;
none.send({ type: 'join', roomId: 't', token: `${b64({ alg: 'none' })}.${b64({ sub: 'x', roles: ['ROLE_ADMIN'] })}.` }); await wait(150);
ok('algoritmo "none" é recusado', none.closedCode() === 4401);
const anon = client(); await anon.ready; anon.send({ type: 'join', roomId: 't' }); await wait(150);
ok('sem token não entra', anon.closedCode() === 4401);

// novo jogador: histórico + saída
const late = client(); await late.ready; late.send({ type: 'join', roomId: 't', token: userTok }); await wait(150);
ok('quem entra depois recebe o histórico do chat', late.last('chat-history')?.messages?.some(x => x.text === 'Olá pessoal!'));
ok('quem entra depois recebe o layout persistido', late.last('room-layout')?.objects?.[0]?.id === 'a');
const gid = guest.last('welcome').id; guest.ws.close(); await wait(150);
ok('saída é avisada (presence-leave)', root.last('presence-leave')?.id === gid);

root.ws.close(); late.ws.close(); await wait(800); srv.kill();

  // Reinício do servidor: a sala do root continua salva em disco.
  await wait(300);
  const srv2 = await startServer();
  const again = client(); await again.ready;
  again.send({ type: 'join', roomId: 't', token: userTok }); await wait(200);
  ok('a sala salva sobrevive ao reinício do servidor', again.last('room-layout')?.objects?.[0]?.id === 'a');
  ok('o histórico do chat sobrevive ao reinício do servidor', again.last('chat-history')?.messages?.some(x => x.text === 'Olá pessoal!'));
  again.ws.close(); await wait(100); srv2.kill();

  const failed = results.filter(([, passed]) => !passed).map(([name]) => name);
  assert.deepEqual(failed, [], `verificações que falharam: ${failed.join(' | ')}`);
  assert.ok(results.length >= 29);
});
