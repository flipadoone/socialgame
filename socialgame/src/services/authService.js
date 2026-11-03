export const SESSION_TOKEN_KEY = 'habbo_jwt_token';

export const ALLOWED_ANGULAR_ORIGINS = Object.freeze([
  'http://localhost:4200',
  'http://127.0.0.1:4200',
]);

export function setSessionToken(token) {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

export function getSessionToken() {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
}

export function isAuthenticated() {
  const token = getSessionToken();
  return !!token; // Retorna true se o token existir
}

export function clearSession({ all = false } = {}) {
  if (all) {
    localStorage.clear();
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export function extractLoginToken(data) {
  if (!data || typeof data !== 'object' || data.type !== 'LOGIN_SUCCESS') return null;
  
  const token = data.token ?? data.jwtToken ?? data.accessToken ?? data.jwt ??
    data.data?.token ?? data.data?.jwtToken ?? data.data?.accessToken ?? data.access_token ?? data.data?.access_token ??
    data.payload?.token ?? (typeof data.data === 'string' ? data.data : null);
    
  return typeof token === 'string' && token.trim() && !['undefined', 'null'].includes(token)
    ? token.trim() : null;
}

export function isTrustedAngularOrigin(origin) {
  return ALLOWED_ANGULAR_ORIGINS.includes(origin);
}