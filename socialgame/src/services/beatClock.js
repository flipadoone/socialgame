import { useSyncExternalStore } from 'react';

/**
 * Passo atual do sequenciador, fora do estado do React.
 * Antes, cada passo (8x por segundo) fazia o App inteiro re-renderizar; agora só quem
 * mostra o passo (a janela da DAW) assina este valor.
 */
let currentStep = -1;
const listeners = new Set();

export function setBeatStep(step) {
  if (step === currentStep) return;
  currentStep = step;
  listeners.forEach(listener => listener());
}

const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const useBeatStep = () => useSyncExternalStore(subscribe, () => currentStep);
