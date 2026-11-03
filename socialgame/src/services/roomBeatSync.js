/** Sincronização de beat por WebSocket. Sem URL configurada, usa BroadcastChannel
 * (útil para testes em abas do mesmo navegador, mas não conecta computadores diferentes). */
export function connectRoomBeat({ roomId = 'habbo-main-room', onState, onStatus }) {
  const wsUrl = import.meta.env.VITE_ROOM_WS_URL;
  let socket = null;
  let channel = null;
  let closed = false;

  if (wsUrl) {
    try {
      socket = new WebSocket(wsUrl);
      socket.addEventListener('open', () => {
        onStatus?.('connected');
        socket.send(JSON.stringify({ type: 'join', roomId }));
      });
      socket.addEventListener('message', event => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'beat-state' && message.state) onState?.(message.state);
        } catch { /* ignora mensagens inválidas */ }
      });
      socket.addEventListener('close', () => onStatus?.('disconnected'));
      socket.addEventListener('error', () => onStatus?.('error'));
      return {
        publish: state => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'beat-state', roomId, state })); },
        close: () => { closed = true; socket?.close(); },
      };
    } catch (error) { onStatus?.('error'); }
  }

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(`habbo-room-beat:${roomId}`);
    channel.onmessage = event => { if (event.data?.type === 'beat-state') onState?.(event.data.state); };
    onStatus?.('local-only');
  } else onStatus?.('offline');

  return {
    publish: state => channel?.postMessage({ type: 'beat-state', state }),
    close: () => { closed = true; channel?.close(); },
  };
}
