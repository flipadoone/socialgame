import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError, SESSION_TOKEN_KEY, apiLogin, apiMe, apiRegister, clearSession, getRoles,
  getSessionUser, getTokenExpiry, getValidSessionToken, isRootSession, saveSession,
} from '../services/authService';

/**
 * Estado de autenticação do jogo.
 * status: 'checking' (validando sessão salva) | 'unauthenticated' | 'authenticated'.
 * A sessão persiste entre visitas, é revalidada no servidor ao abrir (GET /auth/me),
 * expira junto com o JWT e é sincronizada entre abas.
 */
export function useAuth() {
  const [session, setSession] = useState(() => {
    const token = getValidSessionToken();
    const user = getSessionUser();
    return token && user ? { token, user } : null;
  });
  const [status, setStatus] = useState(() => (session ? 'checking' : 'unauthenticated'));
  const [notice, setNotice] = useState('');
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const logout = useCallback((reason = '') => {
    clearSession();
    setSession(null);
    setStatus('unauthenticated');
    setNotice(reason);
  }, []);

  // Ao abrir: confirma no backend que o token ainda vale e atualiza nome/papéis.
  useEffect(() => {
    if (status !== 'checking') return undefined;
    let cancelled = false;
    apiMe(session.token)
      .then(user => {
        if (cancelled) return;
        saveSession({ token: session.token, user });
        setSession({ token: session.token, user });
        setStatus('authenticated');
      })
      .catch(error => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
          logout('Sua sessão expirou. Entre novamente.');
        } else {
          // Backend fora do ar: mantém o login local (JWT ainda válido) em vez de deslogar.
          setStatus('authenticated');
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desloga automaticamente quando o JWT expira.
  useEffect(() => {
    if (!session?.token) return undefined;
    const expiry = getTokenExpiry(session.token);
    if (!expiry) return undefined;
    const timer = window.setTimeout(
      () => logout('Sua sessão expirou. Entre novamente.'),
      Math.min(Math.max(0, expiry - Date.now()), 2 ** 31 - 1),
    );
    return () => window.clearTimeout(timer);
  }, [session?.token, logout]);

  // Sincroniza login/logout entre abas do mesmo navegador.
  useEffect(() => {
    function onStorage(event) {
      if (event.key !== SESSION_TOKEN_KEY && event.key !== null) return;
      const token = getValidSessionToken();
      if (!token && sessionRef.current) logout('Sessão encerrada em outra aba.');
      else if (token && !sessionRef.current) {
        setSession({ token, user: getSessionUser() });
        setStatus('authenticated');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const result = await apiLogin(email.trim(), password);
    saveSession(result);
    setSession(result);
    setNotice('');
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (name, email, password) => {
    await apiRegister(name.trim(), email.trim(), password);
    await login(email, password);
  }, [login]);

  return useMemo(() => ({
    status,
    notice,
    token: session?.token ?? null,
    user: session?.user ?? null,
    roles: session ? getRoles(session.token, session.user) : [],
    isRoot: session ? isRootSession(session.token, session.user) : false,
    login,
    register,
    logout,
  }), [status, notice, session, login, register, logout]);
}
