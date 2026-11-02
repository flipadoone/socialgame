import React, { useState, useEffect, useRef } from 'react';
import { setSessionToken, isAuthenticated, clearSession } from './services/authService';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

const ROOM_ASSETS = {
  floor: "/assets/floor.png",
  wall: "/assets/wall.png",
};

// Sprites Parados (0 a 7)
const AVATAR_IDLE_SPRITES = {
  0: "/assets/persona/avatarimage0.png",
  1: "/assets/persona/avatarimage1.png",
  2: "/assets/persona/avatarimage2.png",
  3: "/assets/persona/avatarimage3.png",
  4: "/assets/persona/avatarimage4.png",
  5: "/assets/persona/avatarimage5.png",
  6: "/assets/persona/avatarimage6.png",
  7: "/assets/persona/avatarimage7.png",
};

// Sprites de Caminhada (0 a 7)
const AVATAR_WALK_SPRITES = {
  0: "/assets/persona/avatarimage0.png",
  1: "/assets/persona/avatarimage1.png",
  2: "/assets/persona/avatarimage2.png",
  3: "/assets/persona/avatarimage3.png",
  4: "/assets/persona/avatarimage4.png",
  5: "/assets/persona/avatarimage5.png",
  6: "/assets/persona/avatarimage6.png",
  7: "/assets/persona/avatarimage7.png",
};

function getDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy < 0) return 0; // Norte
  if (dx > 0 && dy < 0) return 1;  // Nordeste
  if (dx > 0 && dy === 0) return 2; // Leste
  if (dx > 0 && dy > 0) return 3;  // Sudeste
  if (dx === 0 && dy > 0) return 4; // Sul
  if (dx < 0 && dy > 0) return 5;  // Sudoeste
  if (dx < 0 && dy === 0) return 6; // Oeste
  if (dx < 0 && dy < 0) return 7;  // Noroeste

  return 4;
}

// CATÁLOGO DE MÓVEIS
const CATALOG_ITEMS = [
  { id: "spraycans", name: "Latas de Spray / Graffiti", sprite: "/assets/spraycans.png", type: "decor", tileWidth: 1, tileHeight: 1, renderHeight: 48, offsetY: 0, actionType: "GRAFFITI" },
  { id: "desk", name: "Estação Dev (2x2)", sprite: "/assets/desk.png", type: "desk", tileWidth: 2, tileHeight: 2, renderHeight: 64, offsetY: 0, apiKey: "2" },
  { id: "noticeboard", name: "Quadro de Avisos", sprite: "/assets/noticeboard.png", type: "decor", tileWidth: 2, tileHeight: 2, renderHeight: 80, offsetY: 0, apiKey: "1" },
  { id: "beat", name: "Mesa Beat Studio / DAW", sprite: "/assets/beat.png", type: "beat", tileWidth: 2, tileHeight: 2, renderHeight: 60, offsetY: 0, apiKey: "3" },
  { id: "postit", name: "Post-it de Parede", sprite: "/assets/postit.png", type: "wall_decor", tileWidth: 1, tileHeight: 1, renderHeight: 28, offsetY: -65, actionType: "POSTIT" },
  { id: "sticker", name: "Adesivo de Chão / Conquistas", sprite: "/assets/sticker.png", type: "decor", tileWidth: 1, tileHeight: 1, renderHeight: 32, offsetY: 0, actionType: "ACHIEVEMENTS" },
  { id: "chair", name: "Cadeira Dev (1x1)", sprite: "/assets/chair.png", type: "sit", tileWidth: 1, tileHeight: 1, renderHeight: 48, offsetY: 0 },
  { id: "colchao", name: "Colchão (2x1)", sprite: "/assets/colchao.png", type: "sit", tileWidth: 2, tileHeight: 1, renderHeight: 60, offsetY: 0 }
];

function findPath(start, target, gridRows, gridCols, blockedTiles = []) {
  const queue = [[start]];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);

  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current.x === target.x && current.y === target.y) {
      return path.slice(1);
    }

    for (const dir of directions) {
      const nextX = current.x + dir.x;
      const nextY = current.y + dir.y;
      const key = `${nextX},${nextY}`;

      const isWithinBounds = nextX >= 0 && nextX < gridCols && nextY >= 0 && nextY < gridRows;
      const isBlocked = blockedTiles.some(
        (b) => b.x === nextX && b.y === nextY && !(nextX === target.x && nextY === target.y)
      );

      if (isWithinBounds && !isBlocked && !visited.has(key)) {
        visited.add(key);
        queue.push([...path, { x: nextX, y: nextY }]);
      }
    }
  }

  return [];
}

export default function App() {
  const [isRootUser] = useState(() => isAuthenticated());
  const [roomSize] = useState({ rows: 9, cols: 9 });
  const [avatarPos, setAvatarPos] = useState({ x: 1, y: 1 });
  const [avatarDir, setAvatarDir] = useState(4);
  const [currentPath, setCurrentPath] = useState([]);
  const [isWalking, setIsWalking] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [catalogOpen, setCatalogOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  const [placingItem, setPlacingItem] = useState(null);
  const [movingObjId, setMovingObjId] = useState(null);

  const [roomObjects, setRoomObjects] = useState([
    {
      id: "pc_desk",
      name: "Estação Dev (2x2)",
      sprite: "/assets/desk.png",
      gridPosition: { x: 3, y: 2 },
      tileWidth: 2,
      tileHeight: 2,
      renderHeight: 64,
      offsetY: 0,
      rotation: 1,
      type: "desk",
      walkable: false,
    },
    {
      id: "chair_dev",
      name: "Cadeira Dev (1x1)",
      sprite: "/assets/chair.png",
      gridPosition: { x: 3, y: 4 },
      tileWidth: 1,
      tileHeight: 1,
      renderHeight: 48,
      offsetY: 0,
      rotation: 1,
      type: "sit",
      walkable: true,
    }
  ]);

  // Tecla ESC para cancelar colocação ou movimento pendente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPlacingItem(null);
        setMovingObjId(null);
        setSelectedObject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getIsoCoords = (x, y) => {
    const screenX = (x - y) * (TILE_WIDTH / 2);
    const screenY = (x + y) * (TILE_HEIGHT / 2);
    return { x: screenX, y: screenY };
  };

  const handleWheelZoom = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    setZoomLevel((prev) => Math.min(Math.max(0.5, prev + zoomFactor), 2.0));
  };

  const blockedTiles = roomObjects
    .filter((obj) => !obj.walkable && obj.type !== "wall_decor")
    .flatMap((obj) => {
      const tiles = [];
      for (let w = 0; w < (obj.tileWidth || 1); w++) {
        for (let h = 0; h < (obj.tileHeight || 1); h++) {
          tiles.push({ x: obj.gridPosition.x + w, y: obj.gridPosition.y + h });
        }
      }
      return tiles;
    });

  const handleTileClick = (targetX, targetY) => {
    if (placingItem) {
      const isWallTile = targetX === 0 || targetY === 0;
      if (placingItem.type === "wall_decor" && !isWallTile) {
        alert("Objetos de parede (como Post-it) devem ser colocados junto às paredes (X=0 ou Y=0)!");
        return;
      }

      const newObj = {
        id: `${placingItem.id}_${Date.now()}`,
        name: placingItem.name,
        sprite: placingItem.sprite,
        type: placingItem.type,
        tileWidth: placingItem.tileWidth || 1,
        tileHeight: placingItem.tileHeight || 1,
        renderHeight: placingItem.renderHeight || 48,
        offsetY: placingItem.offsetY || 0,
        gridPosition: { x: targetX, y: targetY },
        rotation: 1,
        walkable: placingItem.type === "sit" || placingItem.type === "wall_decor",
      };
      setRoomObjects((prev) => [...prev, newObj]);
      setPlacingItem(null);
      return;
    }

    if (movingObjId) {
      const movingObj = roomObjects.find((o) => o.id === movingObjId);
      const isWallTile = targetX === 0 || targetY === 0;
      if (movingObj && movingObj.type === "wall_decor" && !isWallTile) {
        alert("Objetos de parede devem ser colocados junto às paredes (X=0 ou Y=0)!");
        return;
      }

      setRoomObjects((prev) =>
        prev.map((obj) =>
          obj.id === movingObjId ? { ...obj, gridPosition: { x: targetX, y: targetY } } : obj
        )
      );
      setMovingObjId(null);
      return;
    }

    const path = findPath(avatarPos, { x: targetX, y: targetY }, roomSize.rows, roomSize.cols, blockedTiles);
    if (path.length > 0) {
      setCurrentPath(path);
      setIsWalking(true);
    }
  };

  const handleRotateObject = (objId) => {
    setRoomObjects((prev) =>
      prev.map((obj) =>
        obj.id === objId ? { ...obj, rotation: (obj.rotation || 1) * -1 } : obj
      )
    );
  };

  const handleRemoveObject = (objId) => {
    setRoomObjects((prev) => prev.filter((obj) => obj.id !== objId));
    if (selectedObject?.id === objId) {
      setSelectedObject(null);
    }
  };

  const handleStartMovingObject = (objId) => {
    setMovingObjId(objId);
    setSelectedObject(null);
  };

  useEffect(() => {
    if (currentPath.length === 0) {
      setIsWalking(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextStep = currentPath[0];
      const nextDir = getDirection(avatarPos, nextStep);
      setAvatarDir(nextDir);
      setIsWalking(true);

      setAvatarPos(nextStep);
      setCurrentPath((prev) => prev.slice(1));
    }, 280);

    return () => clearTimeout(timer);
  }, [currentPath, avatarPos]);

  const { x: avatarPX, y: avatarPY } = getIsoCoords(avatarPos.x, avatarPos.y);
  const cornerIso = getIsoCoords(0, 0);

  const currentAvatarSprite = isWalking
    ? (AVATAR_WALK_SPRITES[avatarDir] || AVATAR_IDLE_SPRITES[avatarDir])
    : AVATAR_IDLE_SPRITES[avatarDir];

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
            H
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-wide">Habbo Studio - Passo 3 Ajustado</h1>
            <p className="text-xs text-slate-400">Pressione ESC para cancelar ações</p>
          </div>
        </div>

        {/* AVISO VISUAL DE MODO DE AÇÃO ATIVO (COM BOTÃO DE CANCELAR) */}
        {(placingItem || movingObjId) && (
          <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-lg flex items-center gap-3 animate-pulse">
            <span className="text-xs font-bold text-amber-300">
              {placingItem ? `🛠️ Colocando: ${placingItem.name}` : `📦 Movendo item`} (Pressione ESC)
            </span>
            <button
              onClick={() => { setPlacingItem(null); setMovingObjId(null); }}
              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatalogOpen(!catalogOpen)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition"
          >
            {catalogOpen ? "◄ Fechar Loja" : "► Móveis"}
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex overflow-hidden">
        
        {catalogOpen && (
          <aside className="w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col z-20 shadow-2xl p-4 overflow-y-auto">
            <h2 className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-3">Seus Móveis</h2>
            <div className="space-y-3">
              {CATALOG_ITEMS.map((item) => (
                <div key={item.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.sprite} alt="" className="w-8 h-8 object-contain" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{item.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPlacingItem(item); setSelectedObject(null); }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    + Usar
                  </button>
                </div>
              ))}
            </div>

            {selectedObject && (
              <div className="mt-6 pt-4 border-t border-slate-800 bg-slate-800/40 p-3 rounded-xl border border-indigo-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-indigo-300">Item: {selectedObject.name}</h3>
                  <button onClick={() => setSelectedObject(null)} className="text-xs text-slate-400 hover:text-white font-bold">✕</button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleRotateObject(selectedObject.id)}
                    className="py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    🔄 Rotacionar
                  </button>
                  <button
                    onClick={() => handleStartMovingObject(selectedObject.id)}
                    className="py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    📦 Mover de Lugar
                  </button>
                  <button
                    onClick={() => handleRemoveObject(selectedObject.id)}
                    className="py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        <main 
          onWheel={handleWheelZoom}
          className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden cursor-grab"
        >
          <div 
            className="relative w-0 h-0 transition-transform duration-150 ease-out" 
            style={{ transform: `translateY(-20px) scale(${zoomLevel})` }}
          >
            
            {/* PAREDE ESQUERDA */}
            {(() => {
              const wallHeight = 120;
              const width = roomSize.cols * (TILE_WIDTH / 2);
              const heightSlope = roomSize.cols * (TILE_HEIGHT / 2);
              return (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${cornerIso.x - width}px`,
                    top: `${cornerIso.y - wallHeight}px`,
                    width: `${width}px`,
                    height: `${heightSlope + wallHeight}px`,
                    backgroundColor: '#9e9e9e',
                    clipPath: `polygon(100% 0, 0 ${heightSlope}px, 0 100%, 100% ${heightSlope + wallHeight}px)`,
                    borderTop: '2px solid #bebebe',
                    zIndex: 5,
                  }}
                />
              );
            })()}

            {/* PAREDE DIREITA */}
            {(() => {
              const wallHeight = 120;
              const width = roomSize.rows * (TILE_WIDTH / 2);
              const heightSlope = roomSize.rows * (TILE_HEIGHT / 2);
              return (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${cornerIso.x}px`,
                    top: `${cornerIso.y - wallHeight}px`,
                    width: `${width}px`,
                    height: `${heightSlope + wallHeight}px`,
                    backgroundColor: '#828282',
                    clipPath: `polygon(0 0, 100% ${heightSlope}px, 100% 100%, 0 ${heightSlope + wallHeight}px)`,
                    borderTop: '2px solid #a6a6a6',
                    zIndex: 5,
                  }}
                />
              );
            })()}

            {/* CHÃO */}
            {Array.from({ length: roomSize.rows }).map((_, y) =>
              Array.from({ length: roomSize.cols }).map((_, x) => {
                const { x: posX, y: posY } = getIsoCoords(x, y);
                return (
                  <div
                    key={`floor-${x}-${y}`}
                    onClick={() => handleTileClick(x, y)}
                    className="absolute cursor-pointer group hover:scale-105"
                    style={{
                      left: `${posX - TILE_WIDTH / 2}px`,
                      top: `${posY}px`,
                      width: `${TILE_WIDTH}px`,
                      height: `${TILE_HEIGHT}px`,
                      zIndex: x + y + 20,
                    }}
                  >
                    <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 64 32">
                      <polygon
                        points="32,0 64,16 32,32 0,16"
                        className="fill-slate-800 stroke-slate-700/60 group-hover:fill-indigo-700/60 transition-colors"
                      />
                    </svg>
                  </div>
                );
              })
            )}

            {/* AVATAR */}
            <div
              className="absolute pointer-events-none transition-all duration-280 ease-linear flex flex-col items-center justify-end"
              style={{
                left: `${avatarPX - 32}px`,
                top: `${avatarPY - 60}px`,
                width: '64px',
                height: '110px',
                zIndex: (avatarPos.x + avatarPos.y) * 10 + 200,
              }}
            >
              <div className="absolute bottom-1 w-8 h-2.5 rounded-full bg-black/70 blur-[1px]" />
              <img
                src={currentAvatarSprite}
                alt="Avatar"
                className="w-full h-full object-contain relative z-10"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* MÓVEIS & WALL DECOR (COM POST-IT ROTACIONADO EM 90 GRAUS) */}
            {roomObjects.map((obj) => {
              const { x: posX, y: posY } = getIsoCoords(obj.gridPosition.x, obj.gridPosition.y);
              const isSelected = selectedObject?.id === obj.id;
              const isWallDecor = obj.type === "wall_decor";
              const isPostIt = obj.id.includes("postit") || obj.actionType === "POSTIT" || obj.id === "postit";

              const tWidth = obj.tileWidth || 1;
              const tHeight = obj.tileHeight || 1;
              const visualWidth = (tWidth + tHeight) * 32;
              const renderHeight = obj.renderHeight || 48;
              const customOffsetY = obj.offsetY || 0;

              const isOnLeftWall = obj.gridPosition.x === 0;
              const isOnRightWall = obj.gridPosition.y === 0;

              const wallOffsetY = isWallDecor ? (customOffsetY || -65) : customOffsetY;
              const topOffset = posY + TILE_HEIGHT - renderHeight + wallOffsetY;

              let wallShiftX = 0;
              if (isPostIt) {
                if (isOnLeftWall) wallShiftX = 16;
                if (isOnRightWall) wallShiftX = -16;
              }

              const leftOffset = posX - (visualWidth / 2) + wallShiftX;

              let transformStyle = `scaleX(${obj.rotation || 1})`;
              if (isPostIt) {
                // Rotação ajustada em 90 graus com base na inclinação isométrica das paredes
                if (isOnLeftWall) {
                  transformStyle = 'rotate(116deg) skewX(30deg) scale(0.85)';
                } else {
                  transformStyle = 'rotate(-116deg) skewX(-30deg) scale(0.85)';
                }
              }

              return (
                <div
                  key={obj.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedObject(obj);
                  }}
                  className={`absolute cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-end ${
                    isSelected ? 'ring-2 ring-indigo-400 rounded-lg bg-indigo-500/20' : ''
                  }`}
                  style={{
                    left: `${leftOffset}px`,
                    top: `${topOffset}px`,
                    width: `${visualWidth}px`,
                    height: `${renderHeight}px`,
                    zIndex: isWallDecor 
                      ? 15 + (obj.gridPosition.x + obj.gridPosition.y)
                      : (obj.gridPosition.x + obj.gridPosition.y) * 10 + 50,
                  }}
                >
                  {!isWallDecor && (
                    <div 
                      className="absolute bottom-1 w-[80%] h-3 rounded-full bg-black/60 blur-[1px] pointer-events-none"
                      style={{ transform: `scaleX(${obj.rotation || 1})` }}
                    />
                  )}
                  <img
                    src={obj.sprite}
                    alt={obj.name}
                    className="w-full h-full object-contain relative z-10 origin-center"
                    style={{ transform: transformStyle }}
                  />
                </div>
              );
            })}

          </div>
        </main>
      </div>
    </div>
  );
}