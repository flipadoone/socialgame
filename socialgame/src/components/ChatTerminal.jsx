import { useEffect, useRef, useState } from 'react';

const MAX_LENGTH = 200;

const STATUS_LABEL = {
  connected: ['online', 'bg-emerald-900 text-emerald-300'],
  connecting: ['conectando…', 'bg-amber-900 text-amber-200'],
  reconnecting: ['reconectando…', 'bg-amber-900 text-amber-200'],
  disconnected: ['desconectado', 'bg-red-900 text-red-200'],
  unauthorized: ['sessão recusada', 'bg-red-900 text-red-200'],
  offline: ['modo solo', 'bg-slate-700 text-slate-300'],
};

function Message({ message, mine }) {
  if (message.kind === 'system') {
    return <p className="py-0.5 text-center text-[10px] italic text-slate-500">{message.text}</p>;
  }
  if (message.kind === 'local') {
    return (
      <article className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-2">
        <div className="mb-0.5 flex justify-between text-[10px] text-amber-300"><b>{message.name}</b><span>{message.time}</span></div>
        <p className="whitespace-pre-line break-words text-amber-100">{message.text}</p>
      </article>
    );
  }
  return (
    <article className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[85%] rounded-xl border p-2 ${mine ? 'border-indigo-500/50 bg-indigo-900/50' : 'border-slate-700/50 bg-slate-800/70'}`}>
        <div className="mb-0.5 flex items-center justify-between gap-3 text-[10px] text-slate-400">
          <b className={message.isRoot ? 'text-amber-300' : 'text-indigo-300'}>{message.isRoot ? '★ ' : ''}{message.name}</b>
          <span>{message.time}</span>
        </div>
        <p className="break-words">{message.text}</p>
      </div>
    </article>
  );
}

/** Chat da sala em tempo real + (para root) auditoria. O texto digitado fica aqui dentro para não re-renderizar o jogo a cada tecla. */
export default function ChatTerminal({
  open, onClose, messages, onSubmit, status, myUserId, isRootUser,
  activeTab, setActiveTab, auditLogs, onExportLogs, onReconnect,
}) {
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const historyRef = useRef({ items: [], index: -1 });
  const inputRef = useRef(null);

  // Mantém a rolagem no fim, a menos que a pessoa tenha subido para ler mensagens antigas.
  useEffect(() => {
    const list = listRef.current;
    if (list && stickRef.current) list.scrollTop = list.scrollHeight;
  }, [messages, activeTab, open]);

  useEffect(() => { if (open && activeTab === 'chat') inputRef.current?.focus(); }, [open, activeTab]);

  if (!open) return null;

  const [statusText, statusClass] = STATUS_LABEL[status] ?? STATUS_LABEL.offline;

  function submit(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    const history = historyRef.current;
    history.items = [value, ...history.items.filter(item => item !== value)].slice(0, 30);
    history.index = -1;
    onSubmit(value);
    setInput('');
    stickRef.current = true;
  }

  function onKeyDown(event) {
    const history = historyRef.current;
    if (event.key === 'ArrowUp' && history.items.length) {
      event.preventDefault();
      history.index = Math.min(history.items.length - 1, history.index + 1);
      setInput(history.items[history.index]);
    } else if (event.key === 'ArrowDown' && history.index >= 0) {
      event.preventDefault();
      history.index -= 1;
      setInput(history.index >= 0 ? history.items[history.index] : '');
    }
  }

  return (
    <section className="fixed bottom-4 right-4 z-40 flex h-[26rem] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900 shadow-2xl" aria-label="Chat da sala">
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-3 py-2">
        <nav className="flex gap-2">
          <button onClick={() => setActiveTab('chat')} className={`rounded-lg px-3 py-1 text-xs font-bold ${activeTab === 'chat' ? 'bg-indigo-600' : 'text-slate-400'}`}>💬 Chat</button>
          {isRootUser && <button onClick={() => setActiveTab('audit')} className={`rounded-lg px-3 py-1 text-xs font-bold ${activeTab === 'audit' ? 'bg-purple-600' : 'text-slate-400'}`}>📜 Auditoria ({auditLogs.length})</button>}
        </nav>
        <div className="flex items-center gap-2">
          <span title="Conexão com a sala" className={`rounded-full px-2 py-0.5 text-[10px] ${statusClass}`}>{statusText}</span>
          <button onClick={onClose} aria-label="Fechar chat" className="text-slate-300 hover:text-white">✕</button>
        </div>
      </header>

      {activeTab === 'chat' && status !== 'connected' && (
        <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-[11px] text-amber-200" role="status">
          <span>
            {status === 'offline' && 'Modo solo: ninguém além de você verá suas mensagens (o servidor da sala não está configurado).'}
            {(status === 'connecting' || status === 'reconnecting') && 'Conectando ao chat da sala…'}
            {status === 'disconnected' && 'Chat desconectado: não consegui falar com o servidor da sala.'}
            {status === 'unauthorized' && 'A sala recusou sua sessão. Saia e entre de novo.'}
          </span>
          {(status === 'disconnected' || status === 'unauthorized') && onReconnect && (
            <button onClick={onReconnect} className="shrink-0 rounded bg-amber-700 px-2 py-0.5 font-bold text-white">Reconectar</button>
          )}
        </div>
      )}

      {activeTab === 'chat' ? (
        <>
          <div
            ref={listRef}
            onScroll={() => { const l = listRef.current; stickRef.current = l.scrollHeight - l.scrollTop - l.clientHeight < 40; }}
            className="flex-1 select-text space-y-2 overflow-y-auto p-3 text-xs"
            aria-live="polite"
          >
            {messages.length === 0 && <p className="mt-6 text-center text-slate-500">Nenhuma mensagem ainda. Diga olá! 👋<br />Digite /help para ver os comandos.</p>}
            {messages.map(message => <Message key={message.id} message={message} mine={message.kind === 'chat' && message.userId === myUserId} />)}
          </div>
          <form onSubmit={submit} className="border-t border-slate-800 bg-slate-950 p-2">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={event => setInput(event.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={onKeyDown}
                placeholder="Mensagem ou /help…"
                maxLength={MAX_LENGTH}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-indigo-500"
              />
              <button disabled={!input.trim()} className="rounded-lg bg-indigo-600 px-3 text-xs font-bold disabled:opacity-50">Enviar</button>
            </div>
            <p className="mt-1 text-right text-[10px] text-slate-600">{input.length}/{MAX_LENGTH}</p>
          </form>
        </>
      ) : (
        <div className="flex flex-1 select-text flex-col overflow-hidden bg-slate-950 p-3">
          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto">
            {auditLogs.map(log => (
              <article key={log.id} className="rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                <div className="flex justify-between text-[10px]"><b>[{log.type}]</b><span>{log.time}</span></div>
                <p className="mt-1 text-slate-300">{log.text}</p>
              </article>
            ))}
          </div>
          <button onClick={onExportLogs} className="mt-2 rounded bg-purple-700 py-2 text-xs font-bold">📥 Exportar auditoria (.json)</button>
        </div>
      )}
    </section>
  );
}
