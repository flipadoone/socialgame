export default function ChatTerminal({
  chatMessages, chatInput, setChatInput, onSubmit, chatOpen, setChatOpen,
  isRootUser, activeTab, setActiveTab, auditLogs, onExportLogs, isLockedOut, lockoutTimer,
}) {
  if (!chatOpen) return null;
  return <section className="fixed bottom-4 right-4 z-40 flex h-96 w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900 shadow-2xl">
    <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-3 py-2"><nav className="flex gap-2">
      <button onClick={() => setActiveTab('chat')} className={`rounded-lg px-3 py-1 text-xs font-bold ${activeTab==='chat'?'bg-indigo-600':'text-slate-400'}`}>💬 Chat</button>
      {isRootUser && <button onClick={() => setActiveTab('audit')} className={`rounded-lg px-3 py-1 text-xs font-bold ${activeTab==='audit'?'bg-purple-600':'text-slate-400'}`}>📜 Audit Logs ({auditLogs.length})</button>}
    </nav><button onClick={() => setChatOpen(false)}>✕</button></header>
    {activeTab === 'chat' ? <>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-xs">{chatMessages.map(m=><article key={m.id} className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-2"><div className="mb-1 flex justify-between text-[10px] text-slate-400"><b className="text-indigo-400">{m.user}</b><span>{m.time}</span></div><p className="whitespace-pre-line">{m.text}</p></article>)}</div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-800 bg-slate-950 p-2"><input value={chatInput} onChange={e=>setChatInput(e.target.value)} disabled={isLockedOut} placeholder={isLockedOut?`Bloqueado (${lockoutTimer}s)...`:'Digite /help...'} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none"/><button disabled={isLockedOut} className="rounded-lg bg-indigo-600 px-3 text-xs font-bold disabled:opacity-50">Enviar</button></form>
    </> : <div className="flex flex-1 flex-col overflow-hidden bg-slate-950 p-3"><div className="flex-1 space-y-2 overflow-y-auto">{auditLogs.map(log=><article key={log.id} className="rounded border border-slate-800 bg-slate-900 p-2 text-xs"><div className="flex justify-between text-[10px]"><b>[{log.type}]</b><span>{log.time}</span></div><p className="mt-1 text-slate-300">{log.text}</p></article>)}</div><button onClick={onExportLogs} className="mt-2 rounded bg-purple-700 py-2 text-xs font-bold">📥 Exportar Audit Logs (.JSON)</button></div>}
  </section>;
}
