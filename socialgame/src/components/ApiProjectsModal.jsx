import { useState } from 'react';

/** Lista (e, para root, cadastro) das APIs vinculadas à mesa de trabalho. */
export default function ApiProjectsModal({ title, projects, canEdit, onAdd, onRemove, onClose }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [endpoint, setEndpoint] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!name || !endpoint) return;
    onAdd({ title: name, desc: desc || 'Endpoint backend ativo.', endpoint });
    setName(''); setDesc(''); setEndpoint('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <section className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900" role="dialog" aria-modal="true" aria-label={title}>
        <header className="flex justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
          <b className="font-mono text-xs text-indigo-300">{title}</b>
          <button onClick={onClose} aria-label="Fechar">✕</button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {canEdit && (
            <form onSubmit={submit} className="space-y-2 rounded-xl border border-indigo-500/30 bg-slate-800 p-4">
              <h3 className="text-sm font-bold text-indigo-300">⚡ Cadastrar Nova API</h3>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Nome da API" value={name} onChange={e => setName(e.target.value)} className="rounded bg-slate-950 p-2 text-xs" />
                <input required placeholder="Endpoint" value={endpoint} onChange={e => setEndpoint(e.target.value)} className="rounded bg-slate-950 p-2 text-xs" />
              </div>
              <input placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded bg-slate-950 p-2 text-xs" />
              <button className="w-full rounded bg-indigo-600 p-2 text-xs font-bold">+ Cadastrar</button>
            </form>
          )}
          <h3 className="text-xs font-bold uppercase text-slate-400">APIs Vinculadas</h3>
          {projects.map(api => (
            <article key={api.id} className="flex justify-between rounded-xl border border-slate-700 bg-slate-800 p-4">
              <div>
                <h4 className="text-sm font-bold">{api.title}</h4>
                <p className="text-xs text-slate-300">{api.desc}</p>
                <code className="mt-1 inline-block rounded bg-slate-950 px-2 py-1 text-[11px] text-indigo-400">{api.endpoint}</code>
              </div>
              {canEdit && <button onClick={() => onRemove(api.id)} aria-label={`Remover ${api.title}`} className="text-xs text-red-400">🗑️</button>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
