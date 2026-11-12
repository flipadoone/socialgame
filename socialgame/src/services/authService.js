import { API_URL } from '../config/env.js';

/**
 * Sessão do jogo: login contra o backend Spring Boot (JWT) e persistência local.
 * O papel (root ou não) vem SEMPRE do JWT assinado pelo servidor: ROLE_ADMIN = root.
 * O localStorage só mantém o usuário logado entre visitas; toda operação sensível
 * (editar a sala, alterar o beat) é revalidada no servidor multiplayer e no backend.
 */
export const SESSION_TOKEN_KEY = 'habbo_jwt_token';
export const SESSION_USER_KEY = 'habbo_authenticated_user';
export const ROOT_ROLE = 'ROLE_ADMIN';

const REQUEST_TIMEOUT_MS = 10000;
const isBadToken = token => !token || token === 'undefined' || token === 'null';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Lê o payload do JWT apenas para obter exp/roles/nome. NÃO valida assinatura. */
export function decodeTokenPayload(token) {
  try {
    const part = String(token).split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function getTokenExpiry(token) {
  const exp = decodeTokenPayload(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

export function isTokenExpired(token) {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry <= Date.now();
}

export function getRoles(token, user) {
  const fromToken = decodeTokenPayload(token)?.roles;
  if (Array.isArray(fromToken)) return fromToken;
  return Array.isArray(user?.roles) ? user.roles : [];
}

export const isRootSession = (token, user) => getRoles(token, user).includes(ROOT_ROLE);

export function saveSession({ token, user }) {
  if (isBadToken(token)) return;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  if (user && typeof user === 'object') localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getSessionUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_USER_KEY) || 'null'); } catch { return null; }
}

export function getSessionToken() {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  return isBadToken(token) ? null : token;
}

/** Token salvo e ainda não expirado (limpa a sessão se estiver expirado). */
export function getValidSessionToken() {
  const token = getSessionToken();
  if (!token) return null;
  if (isTokenExpired(token)) { clearSession(); return null; }
  return token;
}

/** Remove só a sessão; móveis, mural e preferências locais são preservados. */
export function clearSession() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
}

async function request(path, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError(
      error.name === 'AbortError'
        ? 'O servidor demorou demais para responder.'
        : `Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend está rodando.`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try { data = await response.json(); } catch { /* corpo vazio */ }

  if (!response.ok) {
    const detail = data?.message || data?.error || data?.errors?.[0]?.message;
    throw new ApiError(detail || `Erro ${response.status} ao falar com o servidor.`, response.status);
  }
  return data?.data ?? data;
}

export async function apiLogin(email, password) {
  try {
    const { token, user } = await request('/api/v1/auth/login', { method: 'POST', body: { email, password } });
    if (isBadToken(token)) throw new ApiError('Resposta de login inválida.', 502);
    return { token, user };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      throw new ApiError('E-mail ou senha inválidos.', error.status);
    }
    throw error;
  }
}

export const apiRegister = (name, email, password) =>
  request('/api/v1/auth/register', { method: 'POST', body: { name, email, password } });

/** Valida o token no servidor e devolve o usuário atual (com papéis atualizados). */
export const apiMe = token => request('/api/v1/auth/me', { token });
