import { useCallback, useEffect, useRef, useState } from 'react';
import { acquireRoomSocket, isRoomServerConfigured } from '../services/roomSocket';

const MAX_MESSAGES = 200;
const BUBBLE_MS = 5000;
const hhmm = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Chat da sala em tempo real: mensagens de todos os jogadores, histórico recente,
 * avisos de entrada/saída e balões de fala sobre os avatares.
 * Mensagens locais (saída de comandos) ficam só neste navegador.
 */
export function useRoomChat() {
  const [messages, setMessages] = useState([]);
  const [bubbles, setBubbles] = useState({});          // playerId -> texto
  const connRef = useRef(null);
  const bubbleTimers = useRef(new Map());

  const push = useCallback(message => {
    setMessages(previous => (previous.some(m => m.id === message.id)
      ? previous
      : [...previous, message].slice(-MAX_MESSAGES)));
  }, []);

  const showBubble = useCallback((playerId, text) => {
    setBubbles(previous => ({ ...previous, [playerId]: text }));
    clearTimeout(bubbleTimers.current.get(playerId));
    bubbleTimers.current.set(playerId, setTimeout(() => {
      bubbleTimers.current.delete(playerId);
      setBubbles(previous => {
        if (!(playerId in previous)) return previous;
        const { [playerId]: _gone, ...rest } = previous;
        return rest;
      });
    }, BUBBLE_MS));
  }, []);

  const addLocal = useCallback((name, text) => {
    const ts = Date.now();
    push({ id: `local-${ts}-${Math.random().toString(36).slice(2, 7)}`, kind: 'local', name, text, ts, time: hhmm(ts) });
  }, [push]);

  useEffect(() => {
    if (!isRoomServerConfigured()) return undefined;
    const conn = acquireRoomSocket();
    connRef.current = conn;
    const timers = bubbleTimers.current;

    const fromServer = (message, kind) => ({
      id: message.id, kind, playerId: message.playerId, userId: message.userId, name: message.name,
      isRoot: !!message.isRoot, text: message.text, ts: message.ts, time: hhmm(message.ts),
    });

    const offs = [
      conn.on('chat-history', message => {
        setMessages(previous => {
          const known = new Set(previous.map(m => m.id));
          const history = (message.messages || []).map(m => fromServer(m, m.kind === 'system' ? 'system' : 'chat')).filter(m => !known.has(m.id));
          return [...history, ...previous].slice(-MAX_MESSAGES);
        });
      }),
      conn.on('chat', message => {
        push(fromServer(message, 'chat'));
        showBubble(message.playerId, message.text);
      }),
      conn.on('system', message => push(fromServer({ ...message, name: 'Sala' }, 'system'))),
      conn.on('error', message => {
        if (message.code === 'rate-limit') addLocal('Sistema', '⏳ Calma! Você está enviando mensagens rápido demais.');
        else if (message.code === 'room-full') addLocal('Sistema', '🚫 A sala está lotada.');
      }),
    ];

    return () => { offs.forEach(off => off()); conn.release(); connRef.current = null; timers.forEach(clearTimeout); timers.clear(); };
  }, [push, showBubble, addLocal]);

  /** Envia ao servidor. Retorna false se a sala não estiver conectada. */
  const send = useCallback(text => connRef.current?.send('chat', { text }) ?? false, []);
  const clear = useCallback(() => setMessages([]), []);

  return { messages, bubbles, send, addLocal, clear };
}
