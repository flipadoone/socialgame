import { useEffect, useRef, useState } from 'react';
import { INSTRUMENTS } from '../config/roomConstants';
import { createAudioEngine, playInstrument } from '../services/audioService';

/** Player permanente da sala: não depende da montagem/fechamento da janela DAW. */
export default function RoomBeatPlayer({ dawState, setDawState }) {
  const engineRef = useRef(null);
  const lastStepRef = useRef(-1);
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
    if (engineRef.current) engineRef.current.master.gain.setTargetAtTime(
      dawState.masterVolume, engineRef.current.context.currentTime, 0.015
    );
  }, [dawState.masterVolume]);

  useEffect(() => {
    if (!dawState.isPlaying || !audioEnabled || !engineRef.current) {
      lastStepRef.current = -1;
      return undefined;
    }
    const tick = () => {
      const stepDuration = 60000 / dawState.bpm / 4;
      const startedAt = dawState.startedAt || Date.now();
      const step = Math.floor(Math.max(0, Date.now() - startedAt) / stepDuration) % 16;
      if (step === lastStepRef.current) return;
      lastStepRef.current = step;
      const anySolo = dawState.solos.some(Boolean);
      if (!dawState.isMuteAll) INSTRUMENTS.forEach((instrument, row) => {
        const allowed = anySolo ? dawState.solos[row] : !dawState.mutes[row];
        if (dawState.pattern[row]?.[step] && allowed) {
          playInstrument(engineRef.current.context, engineRef.current.master, instrument);
        }
      });
      setDawState(prev => prev.currentStep === step ? prev : ({ ...prev, currentStep: step }));
    };
    tick();
    const timer = window.setInterval(tick, 12);
    return () => window.clearInterval(timer);
  }, [audioEnabled, dawState.isPlaying, dawState.startedAt, dawState.bpm, dawState.pattern, dawState.mutes, dawState.solos, dawState.isMuteAll, setDawState]);

  useEffect(() => () => { if (engineRef.current) engineRef.current.context.close(); }, []);

  if (audioEnabled) return <div className="fixed bottom-3 right-3 z-40 rounded-full border border-emerald-500/40 bg-slate-900/95 px-3 py-1.5 text-[10px] text-emerald-300 shadow-lg">{dawState.isPlaying ? '♫ Beat da sala tocando' : '♫ Áudio do quarto ativado'}</div>;
  return <button onClick={enableAudio} className="fixed bottom-3 right-3 z-40 rounded-full border border-amber-400/60 bg-slate-900 px-3 py-2 text-xs font-bold text-amber-200 shadow-lg">🔊 Ativar áudio do quarto</button>;
}
