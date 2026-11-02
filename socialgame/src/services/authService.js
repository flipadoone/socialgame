// Chave utilizada para guardar o token de sessão no navegador
const TOKEN_KEY = 'habbo_jwt_token';

/**
 * Guarda o Token JWT recebido após a autenticação bem-sucedida.
 */
export function setSessionToken(token) {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Recupera o Token JWT atual para enviar nas requisições HTTP.
 */
export function getSessionToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token
}
/**
 * Remove o token ao fazer logout.
 */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Verifica se existe uma sessão ativa com token.
 */
export function isAuthenticated() {
  const token = getSessionToken();
  return !!token; // Retorna true se o token existir
}
