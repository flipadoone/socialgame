import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeTokenPayload, getRoles, getTokenExpiry, isRootSession, isTokenExpired } from '../src/services/authService.js';

const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = payload => `${b64({ alg: 'HS512' })}.${b64(payload)}.assinatura`;
const inSeconds = s => Math.floor(Date.now() / 1000) + s;

test('lê o payload do JWT (inclusive acentos)', () => {
  assert.equal(decodeTokenPayload(token({ name: 'João Açaí' })).name, 'João Açaí');
  assert.equal(decodeTokenPayload('lixo'), null);
});

test('expiração', () => {
  assert.equal(isTokenExpired(token({ exp: inSeconds(-5) })), true);
  assert.equal(isTokenExpired(token({ exp: inSeconds(300) })), false);
  assert.equal(getTokenExpiry(token({})), null);
});

test('root = ROLE_ADMIN no token (o usuário salvo localmente não manda)', () => {
  assert.equal(isRootSession(token({ roles: ['ROLE_ADMIN'] }), null), true);
  assert.equal(isRootSession(token({ roles: ['ROLE_USER'] }), { roles: ['ROLE_ADMIN'] }), false);
  assert.deepEqual(getRoles('invalido', { roles: ['ROLE_USER'] }), ['ROLE_USER']);
});
