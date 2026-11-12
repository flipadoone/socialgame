// `npm run dev`: sobe o servidor da sala E o jogo juntos (antes era preciso lembrar de um segundo terminal,
// e sem o servidor o chat/multiplayer ficam "em modo solo").
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env');
const fileEnv = {};
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) fileEnv[match[1]] = match[2];
  }
}
const port = Number(process.env.ROOM_BEAT_PORT || fileEnv.ROOM_BEAT_PORT || 8787);

const children = [];
function run(label, script, args = []) {
  const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const forward = (stream, out) => {
    let buffer = '';
    stream.on('data', chunk => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) out.write(`[${label}] ${line}\n`);
    });
  };
  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);
  child.on('exit', code => { if (!shuttingDown) { console.log(`[${label}] encerrou (${code}).`); shutdown(code ?? 0); } });
  children.push(child);
}

let shuttingDown = false;
function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) child.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Se já existe um servidor da sala na porta (ex.: via Docker), usa ele em vez de subir outro.
const alreadyRunning = await new Promise(resolve => {
  const probe = net.connect({ port, host: '127.0.0.1' });
  probe.once('connect', () => { probe.destroy(); resolve(true); });
  probe.once('error', () => resolve(false));
});

if (alreadyRunning) console.log(`[sala] já existe um servidor da sala na porta ${port}; usando ele.`);
else run('sala', join(root, 'server', 'roomServer.js'));
run('jogo', join(root, 'node_modules', 'vite', 'bin', 'vite.js'));
