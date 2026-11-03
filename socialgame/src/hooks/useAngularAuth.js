import { useEffect } from 'react';
import {
  extractLoginToken,
  isTrustedAngularOrigin,
  setSessionToken,
} from '../services/authService';

export function useAngularAuth({ onLogin, onAudit }) {
  useEffect(() => {
    function handleMessage(event) {
      if (!isTrustedAngularOrigin(event.origin)) return;

      // Compatibilidade com os formatos de sucesso de autenticação enviados
      // pelo Angular. O token continua obrigatório para elevar a sessão.
      let payload = event.data;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { return; }
      }
      const normalizedPayload = payload && typeof payload === 'object'
        ? {
            ...payload,
            type: ['LOGIN_SUCCESS', 'AUTH_SUCCESS', 'login_success', 'login-success'].includes(payload.type)
              ? 'LOGIN_SUCCESS'
              : payload.type,
            data: payload.data,
          }
        : payload;
      const token = extractLoginToken(normalizedPayload);
      if (!token) return;

      try {
        setSessionToken(token);
        onLogin?.();
        onAudit?.('AUTH', 'Login validado pelo Incident Manager; sessão ROOT persistida.');
      } catch (error) {
        console.error('Falha ao persistir sessão recebida do Angular:', error);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin, onAudit]);
}
