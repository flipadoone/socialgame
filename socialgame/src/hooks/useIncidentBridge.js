import { useCallback, useEffect, useRef } from 'react';
import { INCIDENT_ORIGIN } from '../config/env';

/**
 * Ponte com o Incident Manager (Angular) dentro do iframe: o jogador já fez login no jogo,
 * então o jogo entrega a sessão ao Angular em vez de pedir login de novo.
 *
 *   Angular -> jogo : INCIDENT_READY | INCIDENT_LOGOUT
 *   jogo -> Angular : HABBO_AUTH { token, user }
 *
 * Segurança: só aceita mensagens do iframe aberto E da origem configurada, e só envia o
 * token para essa mesma origem (nunca '*').
 */
export function useIncidentBridge({ iframeRef, auth }) {
  const authRef = useRef(auth);
  authRef.current = auth;

  const sendAuth = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    const { token, user } = authRef.current;
    if (!target || !INCIDENT_ORIGIN || !token) return;
    target.postMessage({ type: 'HABBO_AUTH', token, user }, INCIDENT_ORIGIN);
  }, [iframeRef]);

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== INCIDENT_ORIGIN) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'INCIDENT_READY') sendAuth();
      else if (event.data?.type === 'INCIDENT_LOGOUT') authRef.current.logout('Você saiu pelo Incident Manager.');
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [iframeRef, sendAuth]);

  return sendAuth;
}
