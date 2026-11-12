import { ROOM_ID } from '../config/env';
import { acquireRoomSocket, isRoomServerConfigured } from './roomSocket';

/** Sincronização de beat. Com servidor usa a conexão compartilhada da sala;
 * sem servidor, usa BroadcastChannel (só abas do mesmo navegador). */
export function connectRoomBeat({ onState, onStatus }) {
  if (isRoomServerConfigured()) {
    const conn = acquireRoomSocket();
    const offState = conn.on('beat-state', message => { if (message.state) onState?.(message.state); });
    const offStatus = conn.onStatus(status => onStatus?.(status));
    return {
      publish: state => conn.send('beat-state', { state }),
      close: () => { offState(); offStatus(); conn.release(); },
    };
  }

  if (typeof BroadcastChannel === 'undefined') { onStatus?.('offline'); return { publish() {}, close() {} }; }
  const channel = new BroadcastChannel(`nemo-room-beat:${ROOM_ID}`);
  channel.onmessage = event => { if (event.data?.type === 'beat-state') onState?.(event.data.state); };
  onStatus?.('local-only');
  return {
    publish: state => channel.postMessage({ type: 'beat-state', state }),
    close: () => channel.close(),
  };
}
