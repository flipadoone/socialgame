import { useEffect, useRef, useState } from 'react';
import { createInitialDawState } from '../config/roomConstants';
import { connectRoomBeat } from '../services/roomBeatSync';

const serialize = state => JSON.stringify(state);

/** Mantém o estado da DAW e a sincronização independentes do modal/editor. */
export function useRoomBeat() {
  const [dawState, setDawState] = useState(createInitialDawState);
  const syncRef = useRef(null);
  // Último estado que este cliente e a sala concordam: evita eco e nunca "engole" a próxima edição local.
  const lastSyncedRef = useRef(serialize(createInitialDawState()));

  useEffect(() => {
    const sync = connectRoomBeat({
      onState(remote) {
        setDawState(previous => {
          const next = { ...previous, ...remote };
          lastSyncedRef.current = serialize(next);
          return next;
        });
      },
    });
    syncRef.current = sync;
    return () => { sync.close(); syncRef.current = null; };
  }, []);

  useEffect(() => {
    const serialized = serialize(dawState);
    if (serialized === lastSyncedRef.current) return;
    lastSyncedRef.current = serialized;
    syncRef.current?.publish(JSON.parse(serialized));
  }, [dawState]);

  return { dawState, setDawState };
}
