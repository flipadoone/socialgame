import { useEffect, useRef, useState } from 'react';
import { createInitialDawState } from '../config/roomConstants';
import { connectRoomBeat } from '../services/roomBeatSync';

/** Mantém o estado da DAW e a sincronização independentes do modal/editor. */
export function useRoomBeat() {
  const [dawState, setDawState] = useState(createInitialDawState);
  const syncRef = useRef(null);
  const applyingRemoteState = useRef(false);

  useEffect(() => {
    const sync = connectRoomBeat({
      roomId: import.meta.env.VITE_ROOM_ID || 'habbo-main-room',
      onState(remoteState) {
        applyingRemoteState.current = true;
        setDawState(previous => ({ ...previous, ...remoteState }));
      },
    });

    syncRef.current = sync;
    return () => {
      sync.close();
      syncRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (applyingRemoteState.current) {
      applyingRemoteState.current = false;
      return;
    }

    const { currentStep, ...sharedState } = dawState;
    syncRef.current?.publish(sharedState);
  }, [
    dawState.isPlaying,
    dawState.startedAt,
    dawState.bpm,
    dawState.masterVolume,
    dawState.isMuteAll,
    dawState.pattern,
    dawState.mutes,
    dawState.solos,
  ]);

  return { dawState, setDawState };
}
