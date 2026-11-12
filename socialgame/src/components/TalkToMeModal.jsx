/** Aviso mostrado quando o robô não consegue abrir o TalkToMe (não configurado ou bloqueado). */
export default function TalkToMeModal({ reason, onClose }) {
  const dev = import.meta.env?.DEV;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <section className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-label="Robô TalkToMe">
        <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
          <b className="text-sm text-indigo-300">🤖 Robô TalkToMe</b>
          <button onClick={onClose} aria-label="Fechar">✕</button>
        </header>
        <div className="space-y-3 p-5 text-sm">
          <img src="/assets/robot.png" alt="" className="mx-auto h-16 w-16 object-contain" style={{ imageRendering: 'pixelated' }} />
          {reason === 'blocked' ? (
            <p className="text-center text-slate-300">Não consegui carregar o assistente. Verifique sua conexão ou desative o bloqueador de anúncios para este site e tente de novo.</p>
          ) : (
            <p className="text-center text-slate-300">O robô está descansando por enquanto. Volte mais tarde! 😴</p>
          )}
          {reason !== 'blocked' && dev && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">
              <b>Para o desenvolvedor:</b> defina <code>VITE_TALKTOME_WIDGET_KEY</code> no <code>.env</code> (Canais → Widget → aba Geral → <code>data-client-key</code>) e reinicie o <code>npm run dev</code>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
