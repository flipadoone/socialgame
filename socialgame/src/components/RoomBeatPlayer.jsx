import { useEffect, useRef, useState } from 'react';
import { INSTRUMENTS } from '../config/roomConstants';
import { createAudioEngine, playInstrument } from '../services/audioService';
import { setBeatStep } from '../services/beatClock';

/**
 * Player permanente da sala (não depende da janela da DAW).
 * Em vez de consultar o relógio a cada 12 ms, agenda o próximo passo exatamente na virada
 * do passo seguinte; o estado mais recente é lido por ref, então editar o padrão não reinicia o timer.
 */
export default function RoomBeatPlayer({ dawState }) {
  const engineRef = useRef(null);
  const stateRef = useRef(dawState);
  stateRef.current = dawState;
  const [audioEnabled, setAudioEnabled] = useState(false);

  async function enableAudio() {
    try {
      if (!engineRef.current) engineRef.current = createAudioEngine();
      await engineRef.current.context.resume();
      setAudioEnabled(true);
    } catch (error) {
      console.error('Não foi possível ativar o áudio:', error);
    }
  }

  useEffect(() => {
    const engine = engineRef.current;
    if (engine) engine.master.gain.setTargetAtTime(dawState.masterVolume, engine.context.currentTime, 0.015);
  }, [dawState.masterVolume]);

  useEffect(() => {
    if (!dawState.isPlaying || !audioEnabled || !engineRef.current) { setBeatStep(-1); return undefined; }

    const stepMs = 60000 / dawState.bpm / 4;
    const startedAt = dawState.startedAt || Date.now();
    let timer = 0;
    let lastStep = -1;

    const tick = () => {
      const now = Date.now();
      if (now < startedAt) { timer = window.setTimeout(tick, startedAt - now); return; }

      const elapsed = now - startedAt;
      const step = Math.floor(elapsed / stepMs) % 16;
      if (step !== lastStep) {
        lastStep = step;
        const state = stateRef.current;
        const anySolo = state.solos.some(Boolean);
        if (!state.isMuteAll) {
          INSTRUMENTS.forEach((instrument, row) => {
            const allowed = anySolo ? state.solos[row] : !state.mutes[row];
            if (state.pattern[row]?.[step] && allowed) playInstrument(engineRef.current, instrument);
          });
        }
        setBeatStep(step);
      }
      timer = window.setTimeout(tick, Math.max(4, stepMs - (elapsed % stepMs)));
    };
    tick();

    return () => { window.clearTimeout(timer); setBeatStep(-1); };
  }, [audioEnabled, dawState.isPlaying, dawState.startedAt, dawState.bpm]);

  useEffect(() => () => { engineRef.current?.context.close(); }, []);

  if (audioEnabled) return <div className="fixed bottom-3 left-3 z-40 rounded-full border border-emerald-500/40 bg-slate-900/95 px-3 py-1.5 text-[10px] text-emerald-300 shadow-lg">{dawState.isPlaying ? '♫ Beat da sala tocando' : '♫ Áudio do quarto ativado'}</div>;
  return <button onClick={enableAudio} className="fixed bottom-3 left-3 z-40 rounded-full border border-amber-400/60 bg-slate-900 px-3 py-2 text-xs font-bold text-amber-200 shadow-lg">🔊 Ativar áudio do quarto</button>;
}
