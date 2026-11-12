import { useEffect, useRef, useState } from 'react';
import { getAvatarSprite } from '../config/skins';

function SkinPreview({ skin, dir, walking }) {
  const sprite = getAvatarSprite(skin, dir, walking);
  return (
    <img
      src={sprite.src}
      alt=""
      draggable={false}
      className={`h-24 w-16 object-contain ${sprite.bob ? 'animate-walk-bob' : ''}`}
      style={{ imageRendering: 'pixelated', transform: sprite.mirrored ? 'scaleX(-1)' : undefined, filter: sprite.filter || undefined }}
    />
  );
}

/** Escolha e cadastro de skins do personagem. */
export default function SkinModal({ skins, currentSkinId, onSelect, onAdd, onRemove, customCount, maxCustom, onClose }) {
  const [dir, setDir] = useState(4);
  const [hoverId, setHoverId] = useState(null);
  const [name, setName] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onAdd(files, name);
      setName('');
      setFiles([]);
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      setError(err.message || 'Não foi possível adicionar a skin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="skins-title">
        <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
          <b id="skins-title" className="text-sm text-indigo-300">🎭 Skins do personagem</b>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <button onClick={() => setDir(d => (d + 7) % 8)} aria-label="Girar para a esquerda" className="rounded bg-slate-700 px-2 py-1">◀</button>
            <button onClick={() => setDir(d => (d + 1) % 8)} aria-label="Girar para a direita" className="rounded bg-slate-700 px-2 py-1">▶</button>
            <button onClick={onClose} aria-label="Fechar" className="ml-2 rounded px-2 py-1 hover:bg-slate-700">✕</button>
          </div>
        </header>

        <div className="grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_16rem]">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase text-slate-400">Suas skins</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {skins.map(skin => {
                const active = skin.id === currentSkinId;
                return (
                  <li key={skin.id} onMouseEnter={() => setHoverId(skin.id)} onMouseLeave={() => setHoverId(null)}
                    className={`flex flex-col items-center rounded-xl border-2 p-3 ${active ? 'border-emerald-400 bg-emerald-950/30' : 'border-slate-700 bg-slate-800/70'}`}>
                    <SkinPreview skin={skin} dir={dir} walking={hoverId === skin.id} />
                    <span className="mt-1 max-w-full truncate text-xs font-bold">{skin.name}</span>
                    <span className="text-[10px] text-slate-400">{skin.kind === 'custom' ? 'Sua skin' : 'Padrão do jogo'}</span>
                    <div className="mt-2 flex gap-1">
                      <button onClick={() => onSelect(skin.id)} disabled={active} className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-bold disabled:bg-emerald-700">{active ? '✓ Em uso' : 'Usar'}</button>
                      {skin.kind === 'custom' && (
                        <button onClick={() => { if (window.confirm(`Remover a skin "${skin.name}"?`)) onRemove(skin.id); }} aria-label={`Remover ${skin.name}`} className="rounded bg-red-800 px-2 py-1 text-[11px]">🗑️</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <form onSubmit={submit} className="space-y-3 rounded-xl border border-indigo-500/30 bg-slate-800/60 p-4 text-xs">
            <h3 className="font-bold text-indigo-300">➕ Adicionar skin ({customCount}/{maxCustom})</h3>
            <label className="block font-bold text-slate-300">Nome
              <input value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="Minha skin" className="mt-1 w-full rounded bg-slate-950 p-2 font-normal outline-none focus:ring-1 focus:ring-indigo-500" />
            </label>
            <label className="block font-bold text-slate-300">Imagens
              <input ref={fileInput} type="file" multiple accept="image/png,image/webp,image/gif,image/jpeg" onChange={e => setFiles([...e.target.files])} className="mt-1 block w-full text-[11px] font-normal file:mr-2 file:rounded file:border-0 file:bg-indigo-600 file:px-2 file:py-1 file:text-white" />
            </label>
            <ul className="list-disc space-y-1 pl-4 text-[10px] leading-relaxed text-slate-400">
              <li><b>1 imagem:</b> usada em todas as direções (PNG com fundo transparente fica melhor).</li>
              <li><b>Várias imagens:</b> um conjunto por direção. Nomeie como <code>avatarimage0.png</code> a <code>avatarimage6.png</code> (parado) e <code>avatarimagewalking0.png</code>… (andando).</li>
              <li>As imagens são reduzidas automaticamente e todos na sala veem sua skin.</li>
            </ul>
            <div aria-live="polite">{error && <p className="rounded border border-red-500/40 bg-red-950/40 p-2 text-red-200">{error}</p>}</div>
            <button disabled={busy || files.length === 0 || customCount >= maxCustom} className="w-full rounded bg-emerald-600 py-2 font-bold disabled:opacity-50">
              {busy ? 'Processando...' : files.length ? `Adicionar (${files.length} arquivo${files.length > 1 ? 's' : ''})` : 'Escolha as imagens'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
