/** Motor de áudio (Web Audio API). O ruído é gerado uma única vez e reaproveitado em todos os toques. */
export function createAudioEngine() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Web Audio API não suportada neste navegador.');
  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.8;
  master.connect(context.destination);

  const noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  return { context, master, noise };
}

export function playInstrument(engine, instrument, time = engine.context.currentTime) {
  const { context, master, noise } = engine;
  if (instrument === 'Kick') {
    const osc = context.createOscillator(), gain = context.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.25);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(gain); gain.connect(master); osc.start(time); osc.stop(time + 0.25);
    return;
  }
  const duration = instrument === 'Snare' ? 0.15 : instrument === 'OpenHat' ? 0.22 : instrument === 'Perc' ? 0.08 : 0.04;
  const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
  source.buffer = noise;
  filter.type = instrument === 'Perc' ? 'bandpass' : 'highpass';
  filter.frequency.value = instrument === 'Perc' ? 2500 : instrument === 'Snare' ? 900 : 8000;
  gain.gain.setValueAtTime(instrument === 'Snare' ? 0.7 : 0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
  source.connect(filter); filter.connect(gain); gain.connect(master);
  source.start(time);
  source.stop(time + duration);
}
