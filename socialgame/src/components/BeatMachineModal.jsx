import { INSTRUMENTS } from '../config/roomConstants';

export default function BeatMachineModal({ onClose, dawState, setDawState, triggerAchievement }) {
  function toggle(row, step) { setDawState(p => ({ ...p, pattern: p.pattern.map((r,i) => i === row ? r.map((v,j) => j === step ? !v : v) : r) })); }
  function preset(kind) {
    const patterns = {
      boombap: [[1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],[0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0]],
      trap: [[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],Array(16).fill(1),[0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0]]
    };
    setDawState(p => ({ ...p, pattern: kind === 'clear' ? INSTRUMENTS.map(() => Array(16).fill(false)) : patterns[kind].map(r => r.map(Boolean)) }));
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono"><section className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border-4 border-[#2d190e] bg-[#5a3921]">
    <header className="flex justify-between border-b-4 border-[#2d190e] bg-[#3d251e] px-4 py-3 text-xs font-bold text-amber-100"><span>🌾 Beats - DAW Studio 🌾</span><button onClick={onClose}>✕</button></header>
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#422719] p-3">
      <div className="flex items-center gap-2"><button onClick={() => { if (!dawState.isPlaying) triggerAchievement?.('dj'); setDawState(p => ({...p,isPlaying:!p.isPlaying,startedAt:!p.isPlaying?Date.now()+1000:null})); }} className="border-2 border-amber-400 bg-[#b87c4c] px-3 py-2 text-xs font-bold">{dawState.isPlaying ? '■ STOP' : '▶ PLAY'}</button>
      <div className="flex items-center gap-2 rounded bg-[#2a1810] px-3 py-1"><span className="text-center text-xs">{dawState.bpm}<small className="block text-[9px]">BPM</small></span><span className="flex flex-col"><button onClick={() => setDawState(p => ({...p,bpm:Math.min(200,p.bpm+5)}))}>+</button><button onClick={() => setDawState(p => ({...p,bpm:Math.max(50,p.bpm-5)}))}>-</button></span></div>
      <button onClick={() => setDawState(p => ({...p,isMuteAll:!p.isMuteAll}))} className="bg-[#b87c4c] px-3 py-2 text-xs">MUTE ALL</button></div>
      <div className="flex gap-2"><button onClick={() => preset('boombap')} className="bg-[#b87c4c] px-2 py-1 text-xs">Boom Bap</button><button onClick={() => preset('trap')} className="bg-[#b87c4c] px-2 py-1 text-xs">Trap 808</button></div>
    </div>
    <div className="overflow-auto bg-[#2a1810] p-4"><div className="min-w-[620px]">
      <div className="mb-2 flex pl-36">{Array.from({length:16},(_,i)=><span key={i} className="flex-1 text-center text-[10px]">{i+1}</span>)}</div>
      {INSTRUMENTS.map((name,row)=><div key={name} className="mb-2 flex items-center gap-2"><div className="flex w-36 items-center justify-between border-r-2 border-[#422719] pr-2 text-[11px] text-amber-100"><b>{name}</b><span><button onClick={() => setDawState(p => ({...p,mutes:p.mutes.map((v,i)=>i===row?!v:v)}))}>M</button> <button onClick={() => setDawState(p => ({...p,solos:p.solos.map((v,i)=>i===row?!v:v)}))}>S</button></span></div><div className="flex flex-1 justify-between">{Array.from({length:16},(_,step)=><button key={step} aria-label={`${name} step ${step+1}`} onClick={() => toggle(row,step)} className={`h-6 min-w-5 flex-1 border-2 ${dawState.pattern[row][step]?'border-emerald-300 bg-emerald-500':'border-[#1a0f0a] bg-[#3a2216]'} ${dawState.isPlaying&&dawState.currentStep===step?'outline outline-2 outline-amber-400':''}`} />)}</div></div>)}
      <div className="mt-4 flex justify-between border-t-2 border-[#422719] pt-3"><button onClick={() => preset('clear')} className="text-xs text-red-300">CLEAR</button><label className="text-xs">VOL <input type="range" min="0" max="1" step=".05" value={dawState.masterVolume} onChange={e => setDawState(p => ({...p,masterVolume:Number(e.target.value)}))}/></label></div>
    </div></div>
  </section></div>;
}
