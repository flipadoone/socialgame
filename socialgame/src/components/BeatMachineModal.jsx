export default function BeatMachineModal({ onClose, dawState, setDawState, audioCtxRef, masterGainRef, triggerSound, triggerAchievement }) {
  const instruments = [
    { id: 'Kick', name: 'Kick' },
    { id: 'Snare', name: 'Snare' },
    { id: 'HiHat', name: 'Hi-Hat' },
    { id: 'OpenHat', name: 'Open-Hat' },
    { id: 'Perc', name: 'Perc' }
  ];

  const STEPS = 16;

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = dawState.masterVolume;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const toggleStep = (row, step) => {
    const copy = dawState.pattern.map(r => [...r]);
    copy[row][step] = !copy[row][step];
    setDawState(prev => ({ ...prev, pattern: copy }));
  };

  const loadPreset = (type) => {
    if (type === 'boombap') {
      setDawState(prev => ({
        ...prev,
        pattern: [
          [true, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false],
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
          [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
          [false, false, true, false, false, false, false, true, false, false, true, false, false, false, false, false]
        ]
      }));
    } else if (type === 'trap') {
      setDawState(prev => ({
        ...prev,
        pattern: [
          [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
          [false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false],
          [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false]
        ]
      }));
    } else {
      setDawState(prev => ({
        ...prev,
        pattern: Array(instruments.length).fill(null).map(() => Array(STEPS).fill(false))
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 font-mono select-none">
      <div className="max-w-4xl w-full bg-[#5a3921] border-4 border-[#2d190e] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        
        <div className="bg-[#3d251e] px-4 py-3 flex items-center justify-between border-b-4 border-[#2d190e]">
          <span className="text-xs text-[#f3e5ab] font-bold">🌾 Beats - DAW Studio 🌾</span>
          <button onClick={onClose} className="text-xs text-[#f3e5ab] hover:text-white font-bold">✕</button>
        </div>

        <div className="p-3 flex flex-wrap items-center justify-between gap-3 bg-[#422719] border-b-4 border-[#2d190e]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                initAudio();
                const willPlay = !dawState.isPlaying;
                setDawState(prev => ({ ...prev, isPlaying: willPlay }));
                if (willPlay) triggerAchievement('dj');
              }} 
              className="bg-[#b87c4c] text-[#fff8e7] px-3 py-2 text-xs border-2 border-[#d4a359] font-bold"
            >
              {dawState.isPlaying ? '■ STOP' : '▶ PLAY'}
            </button>

            <div className="flex items-center bg-[#2a1810] border-2 border-[#1a0f0a] px-3 py-1">
              <div className="flex flex-col text-center mr-3">
                <span className="text-xs text-[#f3e5ab] font-bold">{dawState.bpm}</span>
                <span className="text-[9px] text-[#a89278]">BPM</span>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setDawState(prev => ({ ...prev, bpm: Math.min(200, prev.bpm + 5) }))} className="bg-[#b87c4c] text-[10px] px-1 text-white font-bold">+</button>
                <button onClick={() => setDawState(prev => ({ ...prev, bpm: Math.max(50, prev.bpm - 5) }))} className="bg-[#b87c4c] text-[10px] px-1 text-white font-bold">-</button>
              </div>
            </div>

            <button 
              onClick={() => setDawState(prev => ({ ...prev, isMuteAll: !prev.isMuteAll }))} 
              className={`px-3 py-2 text-[10px] bg-[#b87c4c] border-2 border-[#d4a359] font-bold ${dawState.isMuteAll ? 'text-red-400' : 'text-[#fff8e7]'}`}
            >
              MUTE ALL
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => loadPreset('boombap')} className="bg-[#b87c4c] text-[#fff8e7] px-2 py-1 text-[10px] border-2 border-[#d4a359] font-bold">Boom Bap</button>
            <button onClick={() => loadPreset('trap')} className="bg-[#b87c4c] text-[#fff8e7] px-2 py-1 text-[10px] border-2 border-[#d4a359] font-bold">Trap 808</button>
          </div>
        </div>

        <div className="p-4 bg-[#2a1810] flex-1 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex items-center mb-2">
              <div className="w-36"></div>
              <div className="flex-1 flex justify-between pr-2">
                {Array.from({ length: STEPS }).map((_, i) => (
                  <span key={i} className={`w-6 text-center text-[10px] font-bold ${i % 4 === 0 ? 'text-[#fbbf24]' : 'text-[#a89278]'}`}>{i + 1}</span>
                ))}
              </div>
            </div>

            {instruments.map((inst, rIdx) => (
              <div key={inst.id} className="flex items-center mb-2">
                <div className="w-36 pr-2 flex items-center justify-between border-r-2 border-[#422719] mr-2">
                  <span className="text-[11px] text-[#f3e5ab] font-bold">{inst.name}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const copy = [...dawState.mutes];
                        copy[rIdx] = !copy[rIdx];
                        setDawState(prev => ({ ...prev, mutes: copy }));
                      }} 
                      className={`w-5 h-5 text-[9px] font-bold border border-[#5a3921] ${dawState.mutes[rIdx] ? 'bg-red-600 text-white' : 'bg-[#3a2216] text-[#a89278]'}`}
                    >M</button>
                    <button 
                      onClick={() => {
                        const copy = [...dawState.solos];
                        copy[rIdx] = !copy[rIdx];
                        setDawState(prev => ({ ...prev, solos: copy }));
                      }} 
                      className={`w-5 h-5 text-[9px] font-bold border border-[#5a3921] ${dawState.solos[rIdx] ? 'bg-yellow-500 text-black' : 'bg-[#3a2216] text-[#a89278]'}`}
                    >S</button>
                  </div>
                </div>

                <div className="flex-1 flex justify-between pr-2">
                  {Array.from({ length: STEPS }).map((_, sIdx) => {
                    const isActive = dawState.pattern[rIdx][sIdx];
                    const isPlayingCurrent = dawState.isPlaying && dawState.currentStep === sIdx;
                    return (
                      <div
                        key={sIdx}
                        onClick={() => toggleStep(rIdx, sIdx)}
                        className={`w-6 h-6 border-2 cursor-pointer transition-transform ${
                          isActive 
                            ? 'bg-emerald-500 border-emerald-300 shadow-[inset_0_0_4px_#000]' 
                            : 'bg-[#3a2216] border-[#1a0f0a] hover:bg-[#4a2d1d]'
                        } ${isPlayingCurrent ? 'outline outline-2 outline-amber-400 z-10' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t-2 border-[#422719] pt-3 mt-4">
            <button onClick={() => loadPreset('clear')} className="bg-[#b87c4c] text-red-300 px-2 py-1 text-[10px] font-bold border-2 border-[#d4a359]">CLEAR</button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#a89278] font-bold">VOL:</span>
              <input 
                type="range" min="0" max="1" step="0.05" value={dawState.masterVolume} 
                onChange={(e) => setDawState(prev => ({ ...prev, masterVolume: parseFloat(e.target.value) }))} 
                className="accent-[#b87c4c] w-24"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
