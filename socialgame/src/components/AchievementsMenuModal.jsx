import { useEffect } from 'react';
import { ACHIEVEMENTS } from '../config/roomConstants';

export function AchievementToast({ achievement, onClose }) {
  useEffect(() => {
    if (!achievement) return undefined;
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [achievement, onClose]);
  if (!achievement) return null;
  return <button onClick={onClose} title="Clique para fechar" className="fixed right-5 top-5 z-[60] flex items-center gap-3 rounded-sm border-2 border-[#555] bg-[#212121] p-3 pr-5 text-left font-mono shadow-2xl">
    <span className="flex h-10 w-10 items-center justify-center border-2 border-fuchsia-700 bg-[#3a3a3a] text-xl">{achievement.icon}</span>
    <span><span className="block text-[11px] font-bold uppercase text-yellow-300">Advancement Made!</span><strong className="block text-xs text-white">{achievement.title}</strong><small className="text-gray-300">{achievement.description}</small></span>
  </button>;
}

export default function AchievementsModal({ unlockedSet, onClose }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono">
    <section className="w-full max-w-lg rounded border-4 border-[#4a4a4a] bg-[#2b2b2b] p-4 text-white shadow-2xl">
      <header className="mb-4 flex justify-between border-b-2 border-[#555] pb-2"><h2 className="text-sm font-bold uppercase text-yellow-300">🏆 Fortschritte / Conquistas</h2><button onClick={onClose}>✕</button></header>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto rounded bg-[#1e1e1e] p-3">
        {ACHIEVEMENTS.map(item => { const done = unlockedSet.has(item.key); return <article key={item.key} className={`flex gap-3 rounded border-2 p-3 ${done ? 'border-green-400 bg-green-950/40' : 'border-[#3a3a3a] opacity-60'}`}>
          <span className="flex h-10 w-10 items-center justify-center rounded border-2 text-xl">{item.icon}</span><div className="flex-1"><div className="flex justify-between text-xs font-bold"><span>{item.title}</span><span>{done ? '✔ Desbloqueada' : '🔒 Bloqueada'}</span></div><p className="mt-1 text-[10px] text-gray-300">{item.description}</p></div>
        </article>; })}
      </div>
    </section>
  </div>;
}
