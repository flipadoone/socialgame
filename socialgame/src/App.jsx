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

function findPath(start, target, gridRows, gridCols) {
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

      if (isWithinBounds && !visited.has(key)) {
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

  const handleTileClick = (targetX, targetY) => {
    const path = findPath(avatarPos, { x: targetX, y: targetY }, roomSize.rows, roomSize.cols);
    if (path.length > 0) {
      setCurrentPath(path);
      setIsWalking(true);
    }
  };

  // Loop de movimento do avatar tile a tile
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
            <h1 className="font-bold text-sm text-slate-100 tracking-wide">Habbo Studio - Passo 2</h1>
            <p className="text-xs text-slate-400">Pathfinding BFS & Animação de Caminhada</p>
          </div>
        </div>
        <div className="text-xs font-mono text-indigo-400">
          {isRootUser ? '● Root Ativo' : '○ Visitante'}
        </div>
      </header>

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

          {/* AVATAR COM PATHFINDING */}
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

        </div>
      </main>
    </div>
  );
}