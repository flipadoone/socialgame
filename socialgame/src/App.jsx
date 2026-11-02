import React, { useState, useEffect, useRef } from 'react';
import { setSessionToken, isAuthenticated, clearSession } from './services/authService';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

const ROOM_ASSETS = {
  floor: "/assets/floor.png",
  wall: "/assets/wall.png",
};

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

export default function App() {
  const [isRootUser, setIsRootUser] = useState(() => isAuthenticated());
  const [roomSize] = useState({ rows: 9, cols: 9 });
  const [avatarPos, setAvatarPos] = useState({ x: 1, y: 1 });
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

  const { x: avatarPX, y: avatarPY } = getIsoCoords(avatarPos.x, avatarPos.y);
  const cornerIso = getIsoCoords(0, 0);

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      
      {/* BARRA SUPERIOR BASE */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
            H
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-wide">Habbo Studio - Base</h1>
            <p className="text-xs text-slate-400">Passo 1: Motor Isométrico Base</p>
          </div>
        </div>
        <div className="text-xs font-mono text-indigo-400">
          {isRootUser ? '● Root Ativo' : '○ Visitante'}
        </div>
      </header>

      {/* ÁREA DA SALA */}
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
                  onClick={() => setAvatarPos({ x, y })}
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

          {/* AVATAR BASE */}
          <div
            className="absolute pointer-events-none flex flex-col items-center justify-end"
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
              src={AVATAR_IDLE_SPRITES[4]}
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