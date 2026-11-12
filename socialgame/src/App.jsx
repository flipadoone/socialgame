import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG_ITEMS } from './config/roomConstants';
import { isRoomServerConfigured, reconnectRoomSocket } from './services/roomSocket';
import { openTalkToMe } from './services/talktomeWidget';
import { useAchievements } from './hooks/useAchievements';
import { useRoomBeat } from './hooks/useRoomBeat';
import { useRoomChat } from './hooks/useRoomChat';
import { useRoomData } from './hooks/useRoomData';
import { useRoomLayout } from './hooks/useRoomLayout';
import { useRoomMovement } from './hooks/useRoomMovement';
import { useRoomPresence } from './hooks/useRoomPresence';
import { useSkins } from './hooks/useSkins';
import AchievementsModal, { AchievementToast } from './components/AchievementsMenuModal';
import ChatTerminal from './components/ChatTerminal';
import RoomBeatPlayer from './components/RoomBeatPlayer';
import RoomCanvas from './components/RoomCanvas';

// Janelas carregadas só quando abertas (bundle inicial menor).
const ApiProjectsModal = lazy(() => import('./components/ApiProjectsModal'));
const BeatMachineModal = lazy(() => import('./components/BeatMachineModal'));
const GraffitiModal = lazy(() => import('./components/GraffitiModal'));
const NoticeboardModal = lazy(() => import('./components/NoticeboardModal'));
const PostItModal = lazy(() => import('./components/PostItModal'));
const SkinModal = lazy(() => import('./components/SkinModal'));
const TalkToMeModal = lazy(() => import('./components/TalkToMeModal'));

const ROOM_SIZE = { rows: 9, cols: 9 };
const clampZoom = value => Math.min(2, Math.max(0.5, value));

const PRESENCE_LABEL = {
  connected: null,
  connecting: '⏳ conectando à sala…',
  reconnecting: '⏳ reconectando à sala…',
  disconnected: '⚠️ sem conexão com a sala',
  unauthorized: '⚠️ a sala recusou sua sessão (confira o JWT_SECRET do servidor)',
};

export default function App({ auth }) {
  const { user, isRoot: isRootUser } = auth;
  const displayName = user?.name || user?.email || 'Jogador';
  const userId = user?.id ?? user?.email ?? 'anon';
  const mountedAt = useRef(Date.now());

  const [zoomLevel, setZoomLevel] = useState(1);
  const {
    roomObjects, setRoomObjects, graffitiData, saveGraffiti, auditLogs, addAuditLog, apiProjects, setApiProjects,
  } = useRoomData({ canPersist: isRootUser });
  const { unlockedAchievements, activeAchievement, setActiveAchievement, unlockAchievement } = useAchievements({ onAudit: addAuditLog });
  const { dawState, setDawState } = useRoomBeat();
  const { allSkins, currentSkin, selectSkin, addSkin, removeSkin, maxCustom, customCount } = useSkins(userId);
  const chat = useRoomChat();

  const [placingItem, setPlacingItem] = useState(null);
  const [movingObjId, setMovingObjId] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeModalObject, setActiveModalObject] = useState(null);
  const [activePostItObject, setActivePostItObject] = useState(null);
  const [isGraffitiOpen, setIsGraffitiOpen] = useState(false);
  const [isBeatOpen, setIsBeatOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isSkinsOpen, setIsSkinsOpen] = useState(false);
  const [talkNotice, setTalkNotice] = useState(null);           // null | 'missing' | 'blocked'
  // Painel lateral (móveis/jogadores): pode ser minimizado para ver mais do quarto; a escolha é lembrada.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('nemo_sidebar_open');
      if (saved !== null) return saved === '1';
    } catch { /* sem armazenamento */ }
    return window.matchMedia?.('(min-width: 768px)').matches ?? true;
  });
  useEffect(() => {
    try { localStorage.setItem('nemo_sidebar_open', sidebarOpen ? '1' : '0'); } catch { /* ignora */ }
  }, [sidebarOpen]);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);

  const notify = useCallback(message => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3500);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Sala compartilhada: o servidor guarda o layout; só o root (ROLE_ADMIN) altera.
  useRoomLayout({ roomObjects, setRoomObjects, canEdit: isRootUser });

  const openIncidentManager = useCallback(() => {
    setIsIncidentOpen(true);
    if (isRootUser) unlockAchievement('hacker');
  }, [isRootUser, unlockAchievement]);

  // Robô: abre a janela de conversa do TalkToMe (ou explica por que não deu).
  const openRobot = useCallback(() => {
    unlockAchievement('robot');
    if (!openTalkToMe(() => setTalkNotice('blocked'))) setTalkNotice('missing');
  }, [unlockAchievement]);

  function runObjectAction(obj) {
    addAuditLog('INTERACT', `${displayName} interagiu com: ${obj.name}`);
    if (obj.actionType === 'GRAFFITI' || obj.id.includes('spraycans')) setIsGraffitiOpen(true);
    else if (obj.actionType === 'POSTIT' || obj.id.includes('postit')) setActivePostItObject(obj);
    else if (obj.actionType === 'BEAT' || obj.id.includes('beat')) setIsBeatOpen(true);
    else if (obj.actionType === 'ACHIEVEMENTS' || obj.id.includes('sticker')) setIsAchievementsOpen(true);
    else if (obj.actionType === 'TALKTOME') openRobot();
    else if (obj.actionType === 'SIT') { setAvatarPos(obj.gridPosition); setIsSitting(true); }
    else if (obj.actionType === 'MODAL') {
      if (obj.id.includes('noticeboard')) openIncidentManager();
      else setActiveModalObject(obj);
    }
  }

  const {
    avatarPos, avatarDir, isWalking, isSitting, setAvatarPos, setIsSitting,
    handleTileClick, handleObjectClick, handleObjectDoubleClick,
  } = useRoomMovement({
    roomObjects, setRoomObjects, isRootUser, placingItem, setPlacingItem, movingObjId, setMovingObjId,
    setSelectedObject, onObjectAction: runObjectAction, addAuditLog, notify, rows: ROOM_SIZE.rows, cols: ROOM_SIZE.cols,
  });

  // Multiplayer: publica meu avatar/skin e recebe os outros jogadores.
  const { others: otherPlayers, status: presenceStatus, myId } = useRoomPresence({
    local: useMemo(() => ({ x: avatarPos.x, y: avatarPos.y, dir: avatarDir, isWalking, isSitting }), [avatarPos, avatarDir, isWalking, isSitting]),
    skin: currentSkin,
  });
  const online = otherPlayers.length + 1;

  const selfPlayer = useMemo(() => ({
    id: myId || 'self', x: avatarPos.x, y: avatarPos.y, dir: avatarDir, isWalking, isSitting,
    name: displayName, isRoot: isRootUser, skin: currentSkin,
  }), [myId, avatarPos, avatarDir, isWalking, isSitting, displayName, isRootUser, currentSkin]);

  // Mensagens novas de outras pessoas com o chat fechado viram um contador no botão.
  const lastMessage = chat.messages[chat.messages.length - 1];
  useEffect(() => {
    if (!lastMessage || chatOpen) return;
    if (lastMessage.kind === 'chat' && lastMessage.userId !== userId && lastMessage.ts >= mountedAt.current) setUnread(n => n + 1);
  }, [lastMessage, chatOpen, userId]);
  useEffect(() => { if (chatOpen) setUnread(0); }, [chatOpen]);

  // Enter abre o chat (quando não está digitando em outro campo).
  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Enter' || event.target.closest('input, textarea, select, [contenteditable]')) return;
      setChatOpen(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const exportAuditLogs = useCallback(() => {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addAuditLog('SECURITY', 'Logs de auditoria descarregados em JSON.');
  }, [auditLogs, addAuditLog]);

  function handleChatSubmit(text) {
    if (!text.startsWith('/')) {
      if (chat.send(text)) return;
      // Sem servidor configurado: eco local; com servidor fora do ar: avisa que não foi enviada.
      if (!isRoomServerConfigured()) chat.addLocal(displayName, text);
      else chat.addLocal('Sistema', '⚠️ Sem conexão com a sala: sua mensagem não foi enviada.');
      return;
    }

    const cmd = text.split(/\s+/)[0].toLowerCase();
    const say = message => chat.addLocal('Sistema', message);
    switch (cmd) {
      case '/help':
      case '/man':
        say(`📌 Comandos:\n/online - quem está na sala\n/skins - trocar ou adicionar skins\n/status - sua sessão e a sala\n/clear - limpar o chat${isRootUser ? '\n/export-logs - exportar auditoria' : ''}\n/logout - sair`);
        break;
      case '/clear': chat.clear(); break;
      case '/online': {
        const names = [`${isRootUser ? '★ ' : ''}${displayName} (você)`, ...otherPlayers.map(p => `${p.isRoot ? '★ ' : ''}${p.name}`)];
        say(`👥 Na sala (${names.length}): ${names.join(', ')}`);
        break;
      }
      case '/skins': setIsSkinsOpen(true); break;
      case '/status':
        say(`Usuário: ${displayName} | Perfil: ${isRootUser ? 'ROOT (administrador)' : 'Jogador'} | Sala: ${presenceStatus} | Online: ${online} | Móveis: ${roomObjects.length}`);
        break;
      case '/export-logs':
        if (isRootUser) { exportAuditLogs(); say('📁 Download dos logs iniciado.'); }
        else say('🔒 Apenas administradores podem exportar a auditoria.');
        break;
      case '/logout':
      case '/exit': auth.logout(); break;
      default: say(`Comando desconhecido: ${cmd}. Digite /help.`);
    }
  }

  const onZoomDelta = useCallback(delta => setZoomLevel(v => clampZoom(v + delta)), []);
  const editing = !!(placingItem || movingObjId);
  const presenceNote = PRESENCE_LABEL[presenceStatus];
  const apiForModal = activeModalObject?.apiKey ? apiProjects.filter(a => a.id === activeModalObject.apiKey) : apiProjects;

  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-slate-950 font-sans text-slate-100">
      <AchievementToast achievement={activeAchievement} onClose={() => setActiveAchievement(null)} />
      <RoomBeatPlayer dawState={dawState} />

      <header className="z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div>
          <h1 className="font-mono text-lg font-black text-indigo-300">NEMOLANDIA</h1>
          <p className="text-[10px] text-slate-400">
            <span className={isRootUser ? 'font-bold text-amber-300' : ''}>{isRootUser ? '★ ROOT' : 'Jogador'}</span> · {displayName}
            {presenceStatus === 'connected' && ` · 👥 ${online} online`}
            {presenceStatus === 'offline' && !isRoomServerConfigured() && ' · modo solo'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setChatOpen(v => !v)} className="relative rounded bg-indigo-600 px-3 py-2 text-xs font-bold">
            💬 Chat
            {unread > 0 && <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-5">{unread > 9 ? '9+' : unread}</span>}
          </button>
          <button onClick={() => setIsSkinsOpen(true)} className="rounded bg-fuchsia-700 px-3 py-2 text-xs font-bold">🎭 Skins</button>
          <button onClick={openIncidentManager} className="rounded bg-slate-700 px-3 py-2 text-xs">📋 Incident Manager</button>
          <button onClick={() => setZoomLevel(v => clampZoom(v + 0.1))} aria-label="Aumentar zoom" className="rounded bg-slate-700 px-3 py-2 text-xs">＋</button>
          <button onClick={() => setZoomLevel(v => clampZoom(v - 0.1))} aria-label="Diminuir zoom" className="rounded bg-slate-700 px-3 py-2 text-xs">－</button>
          <button onClick={() => auth.logout()} className="rounded bg-red-700 px-3 py-2 text-xs font-bold">Sair</button>
        </div>
      </header>

      {presenceNote && <p className="z-20 border-b border-amber-500/30 bg-amber-950/40 px-4 py-1 text-center text-[11px] text-amber-200" role="status">{presenceNote}</p>}

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
        <aside className="absolute inset-y-0 left-0 z-20 w-56 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-900 p-3 shadow-xl md:static md:shadow-none" aria-label="Painel da sala">
          <button onClick={() => setSidebarOpen(false)} className="mb-3 flex w-full items-center justify-between rounded bg-slate-800 px-2 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700" title="Minimizar o painel para ver mais do quarto" aria-label="Minimizar painel">
            <span>Painel</span><span>◀ Minimizar</span>
          </button>
          <h2 className="mb-2 text-xs font-bold uppercase text-slate-400">Na sala ({online})</h2>
          <ul className="mb-4 space-y-1 text-xs">
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />{isRootUser && '★ '}{displayName} <em className="text-slate-500">(você)</em></li>
            {otherPlayers.map(player => <li key={player.id} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-400" />{player.isRoot && '★ '}{player.name}</li>)}
          </ul>

          <h2 className="mb-3 text-xs font-bold uppercase text-slate-400">Catálogo {isRootUser ? '· ROOT' : '· leitura'}</h2>
          {isRootUser ? CATALOG_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setPlacingItem(item); setMovingObjId(null); }} className={`mb-2 flex w-full items-center gap-2 rounded border p-2 text-left text-xs ${placingItem?.id === item.id ? 'border-emerald-400 bg-emerald-950/40' : 'border-slate-700 bg-slate-800'}`}>
              <img src={item.sprite} alt="" draggable={false} className="h-9 w-9 object-contain" />
              <span>{item.name}</span>
            </button>
          )) : <p className="text-xs text-slate-500">Somente administradores (root) editam a sala. Você pode andar, conversar, trocar de skin e usar os objetos.</p>}

          {isRootUser && (
            <>
              <h3 className="mb-2 mt-5 text-xs font-bold uppercase text-slate-400">Objeto selecionado</h3>
              {selectedObject ? (
                <div className="space-y-2 text-xs">
                  <p>{selectedObject.name}</p>
                  <button onClick={() => { setMovingObjId(selectedObject.id); setPlacingItem(null); }} className="w-full rounded bg-indigo-700 p-2">Mover</button>
                  <button onClick={() => { setRoomObjects(p => p.map(o => o.id === selectedObject.id ? { ...o, rotation: (o.rotation || 1) * -1 } : o)); addAuditLog('FURNI', `Objeto rotacionado: ${selectedObject.id}`); }} className="w-full rounded bg-slate-700 p-2">Rotacionar</button>
                  <button onClick={() => { setRoomObjects(p => p.filter(o => o.id !== selectedObject.id)); addAuditLog('FURNI', `Objeto removido: ${selectedObject.name}`); setSelectedObject(null); }} className="w-full rounded bg-red-800 p-2">Remover</button>
                </div>
              ) : <p className="text-[10px] text-slate-500">Clique em um móvel para selecioná-lo.</p>}
            </>
          )}
        </aside>
        )}

        <main className="relative min-w-0 flex-1">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="absolute left-0 top-3 z-20 rounded-r-lg border border-l-0 border-slate-700 bg-slate-800/95 px-2 py-3 text-[11px] font-bold text-slate-200 shadow-lg hover:bg-slate-700" aria-label="Abrir painel" title="Abrir o painel de móveis e jogadores">
              ▶ {isRootUser ? 'Móveis' : 'Painel'}
            </button>
          )}
          <RoomCanvas
            roomSize={ROOM_SIZE} roomObjects={roomObjects} selfPlayer={selfPlayer} otherPlayers={otherPlayers} bubbles={chat.bubbles}
            graffitiData={graffitiData} selectedObjectId={selectedObject?.id ?? null} isRootUser={isRootUser} editing={editing} zoomLevel={zoomLevel}
            onTileClick={handleTileClick} onObjectClick={handleObjectClick} onObjectDoubleClick={handleObjectDoubleClick} onZoomDelta={onZoomDelta}
          />
          {toast && <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800/95 px-4 py-2 text-xs text-slate-100 shadow-lg" role="status">{toast}</p>}
        </main>
      </div>

      <ChatTerminal
        open={chatOpen} onClose={() => setChatOpen(false)} messages={chat.messages} onSubmit={handleChatSubmit}
        status={isRoomServerConfigured() ? presenceStatus : 'offline'} myUserId={userId} isRootUser={isRootUser}
        activeTab={isRootUser ? activeTab : 'chat'} setActiveTab={setActiveTab} auditLogs={auditLogs} onExportLogs={exportAuditLogs} onReconnect={reconnectRoomSocket}
      />

      <Suspense fallback={null}>
        {isGraffitiOpen && <GraffitiModal onClose={() => setIsGraffitiOpen(false)} onSaveGraffiti={saveGraffiti} currentGraffiti={graffitiData} roomRows={ROOM_SIZE.rows} triggerAchievement={unlockAchievement} />}
        {activePostItObject && <PostItModal obj={activePostItObject} onClose={() => setActivePostItObject(null)} />}
        {isBeatOpen && <BeatMachineModal onClose={() => setIsBeatOpen(false)} dawState={dawState} setDawState={setDawState} triggerAchievement={unlockAchievement} />}
        {isIncidentOpen && <NoticeboardModal auth={auth} onClose={() => setIsIncidentOpen(false)} />}
        {talkNotice && <TalkToMeModal reason={talkNotice} onClose={() => setTalkNotice(null)} />}
        {isSkinsOpen && <SkinModal skins={allSkins} currentSkinId={currentSkin.id} onSelect={selectSkin} onAdd={addSkin} onRemove={removeSkin} customCount={customCount} maxCustom={maxCustom} onClose={() => setIsSkinsOpen(false)} />}
        {activeModalObject && (
          <ApiProjectsModal
            title={activeModalObject.name} projects={apiForModal} canEdit={isRootUser} onClose={() => setActiveModalObject(null)}
            onAdd={api => { setApiProjects(p => [...p, { id: Date.now().toString(), ...api }]); addAuditLog('API', `Nova API cadastrada: ${api.title}`); }}
            onRemove={id => setApiProjects(p => p.filter(a => a.id !== id))}
          />
        )}
      </Suspense>
      {isAchievementsOpen && <AchievementsModal unlockedSet={unlockedAchievements} onClose={() => setIsAchievementsOpen(false)} />}
    </div>
  );
}
