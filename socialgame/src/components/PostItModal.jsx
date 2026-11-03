import { useState } from 'react';

export default function PostItModal({ obj, onClose }) {
  const key = `postit_text_${obj.id}`;
  const [text, setText] = useState(() => localStorage.getItem(key) || 'Escreva suas anotações ou lembretes aqui...');
  function update(event) { const value = event.target.value; setText(value); localStorage.setItem(key, value); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
    <section className="relative w-full max-w-lg rounded-xl border-4 border-[#3b220c] bg-[#5c3818] p-4 shadow-2xl">
      <button onClick={onClose} aria-label="Fechar" className="absolute -right-3 -top-3 rounded-full border-2 border-amber-100 bg-red-800 px-3 py-2">✕</button>
      <div className="flex min-h-[300px] flex-col rounded-lg border-4 border-[#8c5a2b] bg-[#e6c896] p-5 text-[#2d1b0a]">
        <header className="mb-3 flex justify-between border-b-2 border-[#a67c4e] pb-2 text-xs font-bold"><span>📌 Bloco de Notas / Post-it</span><span className="text-[10px]">Salvo automaticamente</span></header>
        <textarea autoFocus value={text} onChange={update} placeholder="Digite aqui..." className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none" />
      </div>
    </section>
  </div>;
}
