import { useEffect } from 'react';

/** Modal genérico que hospeda um app externo (ex.: Incident Manager em Angular) em iframe. */
export default function EmbeddedAppModal({ title, url, onClose, iframeRef, onLoad, hint }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // allow-scripts + allow-same-origin na MESMA origem do host anula o sandbox; só liberamos para origem diferente.
  let sameOrigin = false;
  try { sameOrigin = new URL(url, window.location.href).origin === window.location.origin; } catch { /* url inválida */ }
  const sandbox = `allow-scripts allow-forms allow-downloads${sameOrigin ? '' : ' allow-same-origin'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <section className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900 shadow-2xl"
        role="dialog" aria-modal="true" aria-label={title}>
        <header className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-800 px-5 py-3">
          <strong className="font-mono text-xs text-indigo-300">{title}</strong>
          <div className="flex items-center gap-1 text-xs">
            <button onClick={() => { const frame = iframeRef?.current; if (frame) frame.src = url; }} className="rounded px-2 py-1 text-slate-300 hover:bg-slate-700" title="Recarregar">↻</button>
            <button onClick={onClose} aria-label={`Fechar ${title}`} className="rounded px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white">✕</button>
          </div>
        </header>
        <iframe ref={iframeRef} src={url} title={title} onLoad={onLoad} className="w-full flex-1 border-0 bg-white"
          referrerPolicy="strict-origin-when-cross-origin" sandbox={sandbox} />
        {hint && <footer className="border-t border-slate-700 bg-slate-800 px-4 py-2 text-[10px] text-slate-400">{hint}</footer>}
      </section>
    </div>
  );
}
