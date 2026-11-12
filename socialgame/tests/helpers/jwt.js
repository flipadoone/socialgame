import { createHmac } from 'node:crypto';

// Segredo de desenvolvimento do backend (68 bytes => o jjwt assina em HS512, como os tokens reais).
export const DEV_SECRET = 'viaappia-incident-management-system-secret-key-minimum-32-characters';

const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const HASHES = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' };

export function makeJwt(payload, { alg = 'HS512', secret = DEV_SECRET } = {}) {
  const head = b64({ alg }), body = b64(payload);
  const signature = createHmac(HASHES[alg], secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${signature}`;
}

export const inSeconds = seconds => Math.floor(Date.now() / 1000) + seconds;
