import { useCallback, useEffect, useState } from 'react';
import { CATALOG_ITEMS } from './config/roomConstants';
import { clearSession, isAuthenticated } from './services/authService';
import { useAngularAuth } from './hooks/useAngularAuth';
import { useRoomMovement } from './hooks/useRoomMovement';
import { AchievementToast } from './components/AchievementsMenuModal';
import AchievementsModal from './components/AchievementsMenuModal';
import BeatMachineModal from './components/BeatMachineModal';
import RoomBeatPlayer from './components/RoomBeatPlayer';
import { useAchievements } from './hooks/useAchievements';
import { useRoomBeat } from './hooks/useRoomBeat';
import { useRoomData } from './hooks/useRoomData';
import ChatTerminal from './components/ChatTerminal';
import GraffitiModal from './components/GraffitiModal';
import RoomCanvas from './components/RoomCanvas';
import NoticeboardModal from './components/NoticeboardModal';
import PostItModal from './components/PostItModal';

export default function App() {
  const [isRootUser, setIsRootUser] = useState(true); // Inicialmente como true para testes, altere conforme necessário
  const roomSize = { rows: 9, cols: 9 };
  const [zoomLevel, setZoomLevel] = useState(1);
  const {
    roomObjects, setRoomObjects, graffitiData, saveGraffiti,
    auditLogs, addAuditLog, apiProjects, setApiProjects,
  } = useRoomData();
  const {
    unlockedAchievements, activeAchievement, setActiveAchievement, unlockAchievement,
  } = useAchievements({ onAudit: addAuditLog });
  const { dawState, setDawState } = useRoomBeat();
  const [placingItem, setPlacingItem] = useState(null);
  const [movingObjId, setMovingObjId] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeModalObject, setActiveModalObject] = useState(null);
  const [activePostItObject, setActivePostItObject] = useState(null);
  const [isGraffitiModalOpen, setIsGraffitiModalOpen] = useState(false);
  const [isBeatModalOpen, setIsBeatModalOpen] = useState(false);
  const [isAchievementsMenuOpen, setIsAchievementsMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Sistema', text: "Digite '/help' ou autentique-se pelo Quadro de Avisos (Incident Manager).", time: '12:00' }
  ]);
  const [newApiTitle, setNewApiTitle] = useState('');
  const [newApiDesc, setNewApiDesc] = useState('');
  const [newApiEndpoint, setNewApiEndpoint] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Listener para capturar o postMessage enviado pelo Angular e persistir o token no React
  useEffect(() => {
    const handleMessage = (event) => {
      // Valida se os dados contêm o sucesso do login
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        const { token, user } = event.data;
        if (token) {
          localStorage.setItem('habbo_jwt_token', token);
          if (user) {
            localStorage.setItem('habbo_authenticated_user', JSON.stringify(user));
          }
          setIsRootUser(true);
          unlockAchievement('hacker');
          addAuditLog('AUTH', 'Sessão Root iniciada via login bem-sucedido.');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [unlockAchievement, addAuditLog]);

  const movement = useRoomMovement({
    roomObjects, setRoomObjects, isRootUser, placingItem, setPlacingItem,
    movingObjId, setMovingObjId, setSelectedObject,
    onObjectAction: (object) => runObjectAction(object),
    addAuditLog, rows: roomSize.rows, cols: roomSize.cols,
  });
  const {
    avatarPos, avatarDir, isWalking, isSitting, setAvatarPos, setIsSitting,
    handleTileClick, handleObjectClick, handleObjectDoubleClick,
  } = movement;

  const onAngularLogin = useCallback(() => {
    setIsRootUser(true);
    unlockAchievement('hacker');
  }, [unlockAchievement]);
  useAngularAuth({ onLogin: onAngularLogin, onAudit: addAuditLog });

  useEffect(() => {
    if (!isRootUser) {
      setPlacingItem(null);
      setMovingObjId(null);
      setSelectedObject(null);
      setActiveTab('chat');
    }
  }, [isRootUser]);

  function runObjectAction(obj) {
    addAuditLog('INTERACT', `Usuário interagiu com objeto: ${obj.name}`);
    if (obj.actionType === 'GRAFFITI' || obj.id.includes('spraycans')) setIsGraffitiModalOpen(true);
    else if (obj.actionType === 'POSTIT' || obj.id.includes('postit')) setActivePostItObject(obj);
    else if (obj.actionType === 'BEAT' || obj.id.includes('beat')) setIsBeatModalOpen(true);
    else if (obj.actionType === 'ACHIEVEMENTS' || obj.id.includes('sticker')) setIsAchievementsMenuOpen(true);
    else if (obj.actionType === 'SIT') { setAvatarPos(obj.gridPosition); setIsSitting(true); }
    else if (obj.actionType === 'MODAL') setActiveModalObject(obj);
  }

  function exportAuditLogs() {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditLog('SECURITY', 'Logs de auditoria descarregados em JSON.');
  }

  function sendMessage(e) {
    e.preventDefault();
    const value = chatInput.trim();
    if (!value) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cmd = value.split(/\s+/)[0].toLowerCase();
    const reply = (user, text) => setChatMessages(p => [...p, { id: Date.now(), user, text, time }]);
    
    if (cmd === '/clear') {
      setChatMessages([]);
      setChatInput('');
      return;
    }
    
    if (['/help', '/man'].includes(cmd)) {
      reply('SISTEMA (HELP)', "📌 Comandos disponíveis:\n/root - instruções de autenticação\n/exit - sair do modo root\n/clear - limpar terminal\n/status - status da sessão\n/export-logs - exportar JSON");
    } else if (cmd === '/status') {
      reply('SISTEMA (STATUS)', `Privilégio: ${isRootUser ? 'ROOT (Elevado)' : 'VISITANTE (Restrito)'} | Móveis: ${roomObjects.length} | Audit Logs: ${auditLogs.length}`);
    } else if (cmd === '/export-logs') {
      exportAuditLogs();
      reply('SISTEMA', '📁 Download dos logs iniciado.');
    } else if (['/root', '/sudo'].includes(cmd)) {
      reply('SEGURANÇA', "🔒 Login Root manual desativado. Autentique-se pelo Quadro de Avisos (Incident Manager Angular).");
    } else if (cmd === '/exit') {
      clearSession();
      setIsRootUser(false);
      setPlacingItem(null);
      setMovingObjId(null);
      setSelectedObject(null);
      addAuditLog('AUTH', 'Sessão Root encerrada pelo usuário.');
      reply('SISTEMA', '🔒 Modo Root encerrado.');
    } else {
      reply(isRootUser ? 'Root (Dev)' : 'Visitante', value);
    }
    setChatInput('');
  }

  function addApi(e) {
    e.preventDefault();
    if (!newApiTitle || !newApiEndpoint) return;
    setApiProjects(p => [...p, { id: Date.now().toString(), title: newApiTitle, desc: newApiDesc || 'Endpoint backend ativo.', endpoint: newApiEndpoint }]);
    addAuditLog('API', `Nova API cadastrada: ${newApiTitle}`);
    setNewApiTitle('');
    setNewApiDesc('');
    setNewApiEndpoint('');
  }

  const filteredApis = activeModalObject?.apiKey ? apiProjects.filter(a => a.id === activeModalObject.apiKey) : apiProjects;

  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-slate-950 font-sans text-slate-100">
      <AchievementToast achievement={activeAchievement} onClose={() => setActiveAchievement(null)} />
      <RoomBeatPlayer dawState={dawState} setDawState={setDawState} />
      <header className="z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div>
          <h1 className="font-mono text-lg font-black text-indigo-300">HABBO STUDIO</h1>
          <p className="text-[10px] text-slate-400">Isometric Dev Room · {isRootUser ? 'ROOT ACCESS' : 'VISITOR MODE'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setChatOpen(v => !v)} className="rounded bg-indigo-600 px-3 py-2 text-xs font-bold">💬 Chat / Terminal</button>
          <button onClick={() => setActiveModalObject({ id: 'noticeboard', name: 'Incident Management System' })} className="rounded bg-slate-700 px-3 py-2 text-xs">📋 Incident Manager</button>
          {isRootUser && (
            <button onClick={() => { clearSession(); setIsRootUser(false); setPlacingItem(null); setMovingObjId(null); setSelectedObject(null); setActiveModalObject(null); addAuditLog('AUTH', 'Sessão Root encerrada pelo botão Sair.'); }} className="rounded bg-red-700 px-3 py-2 text-xs font-bold">Sair</button>
          )}
          <button onClick={() => setZoomLevel(v => Math.min(2, v + .1))} className="rounded bg-slate-700 px-3 py-2 text-xs">＋</button>
          <button onClick={() => setZoomLevel(v => Math.max(.5, v - .1))} className="rounded bg-slate-700 px-3 py-2 text-xs">－</button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="z-20 w-56 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-900 p-3">
          <h2 className="mb-3 text-xs font-bold uppercase text-slate-400">Catálogo {isRootUser ? '· ROOT' : '· leitura'}</h2>
          {isRootUser ? CATALOG_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setPlacingItem(item); setMovingObjId(null); }} className={`mb-2 flex w-full items-center gap-2 rounded border p-2 text-left text-xs ${placingItem?.id === item.id ? 'border-emerald-400 bg-emerald-950/40' : 'border-slate-700 bg-slate-800'}`}>
              <img src={item.sprite} alt="" className="h-9 w-9 object-contain" />
              <span>{item.name}</span>
            </button>
          )) : <p className="text-xs text-slate-500">Autentique-se no Incident Manager para editar a sala.</p>}
          {isRootUser && (
            <>
              <h3 className="mb-2 mt-5 text-xs font-bold uppercase text-slate-400">Objeto selecionado</h3>
              {selectedObject ? (
                <div className="space-y-2 text-xs">
                  <p>{selectedObject.name}</p>
                  <button onClick={() => { setMovingObjId(selectedObject.id); setPlacingItem(null); }} className="w-full rounded bg-indigo-700 p-2">Mover</button>
                  <button onClick={() => { setRoomObjects(p => p.map(o => o.id === selectedObject.id ? { ...o, rotation: (o.rotation || 1) * -1 } : o)); addAuditLog('FURNI', `Objeto rotacionado: ${selectedObject.id}`); }} className="w-full rounded bg-slate-700 p-2">Rotacionar</button>
                  <button onClick={() => { setRoomObjects(p => p.filter(o => o.id !== selectedObject.id)); setSelectedObject(null); }} className="w-full rounded bg-red-800 p-2">Remover</button>
                </div>
              ) : <p className="text-[10px] text-slate-500">Clique em um móvel para selecioná-lo.</p>}
            </>
          )}
        </aside>
        <main className="min-w-0 flex-1">
          <RoomCanvas roomSize={roomSize} roomObjects={roomObjects} avatarPos={avatarPos} avatarDir={avatarDir} isWalking={isWalking} isSitting={isSitting} graffitiData={graffitiData} selectedObject={selectedObject} isRootUser={isRootUser} placingItem={placingItem} movingObjId={movingObjId} zoomLevel={zoomLevel} onTileClick={handleTileClick} onObjectClick={handleObjectClick} onObjectDoubleClick={handleObjectDoubleClick} onWheelZoom={e => { e.preventDefault(); setZoomLevel(v => Math.min(2, Math.max(.5, v + (e.deltaY < 0 ? .1 : -.1)))); }} />
        </main>
      </div>
      <ChatTerminal chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} onSubmit={sendMessage} chatOpen={chatOpen} setChatOpen={setChatOpen} isRootUser={isRootUser} activeTab={activeTab} setActiveTab={setActiveTab} auditLogs={auditLogs} onExportLogs={exportAuditLogs} isLockedOut={isLockedOut} lockoutTimer={lockoutTimer} />
      {isGraffitiModalOpen && <GraffitiModal onClose={() => setIsGraffitiModalOpen(false)} onSaveGraffiti={saveGraffiti} currentGraffiti={graffitiData} roomRows={roomSize.rows} triggerAchievement={unlockAchievement} />}
      {activePostItObject && <PostItModal obj={activePostItObject} onClose={() => setActivePostItObject(null)} />}
      {isBeatModalOpen && <BeatMachineModal onClose={() => setIsBeatModalOpen(false)} dawState={dawState} setDawState={setDawState} triggerAchievement={unlockAchievement} />}
      {isAchievementsMenuOpen && <AchievementsModal unlockedSet={unlockedAchievements} onClose={() => setIsAchievementsMenuOpen(false)} />}
      {activeModalObject && (
        <>
          {activeModalObject.id === 'noticeboard' || activeModalObject.id.startsWith('noticeboard') ? (
            <NoticeboardModal onClose={() => setActiveModalObject(null)} />
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <section className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900">
                <header className="flex justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
                  <b className="font-mono text-xs text-indigo-300">{activeModalObject.name}</b>
                  <button onClick={() => setActiveModalObject(null)}>✕</button>
                </header>
                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                  {isRootUser && (
                    <form onSubmit={addApi} className="space-y-2 rounded-xl border border-indigo-500/30 bg-slate-800 p-4">
                      <h3 className="text-sm font-bold text-indigo-300">⚡ Cadastrar Nova API</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <input required placeholder="Nome da API" value={newApiTitle} onChange={e => setNewApiTitle(e.target.value)} className="rounded bg-slate-950 p-2 text-xs" />
                        <input required placeholder="Endpoint" value={newApiEndpoint} onChange={e => setNewApiEndpoint(e.target.value)} className="rounded bg-slate-950 p-2 text-xs" />
                      </div>
                      <input placeholder="Descrição" value={newApiDesc} onChange={e => setNewApiDesc(e.target.value)} className="w-full rounded bg-slate-950 p-2 text-xs" />
                      <button className="w-full rounded bg-indigo-600 p-2 text-xs font-bold">+ Cadastrar</button>
                    </form>
                  )}
                  <h3 className="text-xs font-bold uppercase text-slate-400">APIs Vinculadas</h3>
                  {filteredApis.map(api => (
                    <article key={api.id} className="flex justify-between rounded-xl border border-slate-700 bg-slate-800 p-4">
                      <div>
                        <h4 className="text-sm font-bold">{api.title}</h4>
                        <p className="text-xs text-slate-300">{api.desc}</p>
                        <code className="mt-1 inline-block rounded bg-slate-950 px-2 py-1 text-[11px] text-indigo-400">{api.endpoint}</code>
                      </div>
                      {isRootUser && <button onClick={() => setApiProjects(p => p.filter(a => a.id !== api.id))} className="text-xs text-red-400">🗑️</button>}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}