import React, { useState, useEffect } from 'react';
import { ROOM_GRID_SIZE, ROOM_ASSETS, roomObjects } from '../config/roomData';
import { findPath } from '../utils/pathfinding';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

const AVATAR_SPRITES = {
  idle: {
    SW: '/assets/avatar_idle_sw.png',
    SE: '/assets/avatar_idle_se.png',
    NW: '/assets/avatar_idle_nw.png',
    NE: '/assets/avatar_idle_ne.png',
  },
  walk: {
    SW: '/assets/avatar_walk_sw.gif',
    SE: '/assets/avatar_walk_se.gif',
    NW: '/assets/avatar_walk_nw.gif',
    NE: '/assets/avatar_walk_ne.gif',
  }
};

export const RoomCanvas = ({ onSelectObject }) => {
  const [avatarPos, setAvatarPos] = useState({ x: 1, y: 1 });
  const [currentPath, setCurrentPath] = useState([]);
  const [isWalking, setIsWalking] = useState(false);
  const [direction, setDirection] = useState('SE');

  const getIsoCoords = (x, y) => {
    const screenX = (x - y) * (TILE_WIDTH / 2);
    const screenY = (x + y) * (TILE_HEIGHT / 2);
    return { x: screenX, y: screenY };
  };

  const blockedTiles = roomObjects
    .filter((obj) => !obj.walkable)
    .map((obj) => obj.gridPosition);

  const getNextDirection = (current, next) => {
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    if (dx > 0) return 'SE';
    if (dx < 0) return 'NW';
    if (dy > 0) return 'SW';
    if (dy < 0) return 'NE';
    return direction;
  };

  const handleTileClick = (targetX, targetY) => {
    const path = findPath(avatarPos, { x: targetX, y: targetY }, ROOM_GRID_SIZE.rows, ROOM_GRID_SIZE.cols, blockedTiles);
    if (path.length > 0) {
      setCurrentPath(path);
      setIsWalking(true);
    }
  };

  useEffect(() => {
    if (currentPath.length === 0) {
      setIsWalking(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextStep = currentPath[0];
      const newDir = getNextDirection(avatarPos, nextStep);
      setDirection(newDir);
      setAvatarPos(nextStep);
      setCurrentPath((prev) => prev.slice(1));
    }, 250);

    return () => clearTimeout(timer);
  }, [currentPath, avatarPos]);

  const currentAvatarSprite = 
    AVATAR_SPRITES[isWalking ? 'walk' : 'idle'][direction] || '/assets/avatar.png';

  const { x: avatarPX, y: avatarPY } = getIsoCoords(avatarPos.x, avatarPos.y);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-slate-900 overflow-hidden">
      <div className="relative" style={{ transform: 'translateY(-100px)' }}>
        
        {/* 1. CHÃO */}
        {Array.from({ length: ROOM_GRID_SIZE.rows }).map((_, y) =>
          Array.from({ length: ROOM_GRID_SIZE.cols }).map((_, x) => {
            const { x: posX, y: posY } = getIsoCoords(x, y);
            return (
              <img
                key={`floor-${x}-${y}`}
                src={ROOM_ASSETS.floor}
                alt="Floor"
                className="absolute cursor-pointer hover:brightness-110"
                style={{
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: `${TILE_WIDTH}px`,
                  height: `${TILE_HEIGHT}px`,
                  zIndex: x + y,
                }}
                onClick={() => handleTileClick(x, y)}
              />
            );
          })
        )}

        {/* 2. PAREDES DO FUNDO (X = 0 e Y = 0) */}
        {Array.from({ length: ROOM_GRID_SIZE.cols }).map((_, x) => {
          const { x: posX, y: posY } = getIsoCoords(x, 0);
          return (
            <img
              key={`wall-top-${x}`}
              src={ROOM_ASSETS.wall}
              alt="Wall"
              className="absolute pointer-events-none"
              style={{
                left: `${posX}px`,
                top: `${posY - 64}px`,
                width: `${TILE_WIDTH}px`,
                zIndex: x - 1,
              }}
            />
          );
        })}

        {/* 3. AVATAR */}
        <img
          src={currentAvatarSprite}
          alt="Avatar"
          className="absolute transition-all duration-200 ease-linear pointer-events-none"
          style={{
            left: `${avatarPX + 16}px`,
            top: `${avatarPY - 24}px`, // Sintaxe corrigida (top: `${avatarPY - 24}px`)
            zIndex: avatarPos.x + avatarPos.y + 100,
          }}
          onError={(e) => {
            e.target.src = '/assets/avatar.png';
          }}
        />

        {/* 4. MÓVEIS (Mesa e Cadeira) */}
        {roomObjects.map((obj) => {
          const { x: posX, y: posY } = getIsoCoords(obj.gridPosition.x, obj.gridPosition.y);
          return (
            <img
              key={obj.id}
              src={obj.sprite}
              alt={obj.name}
              className="absolute cursor-pointer hover:scale-105 transition-transform"
              style={{
                left: `${posX}px`,
                top: `${posY - 32}px`, // Sintaxe corrigida (top: `${posY - 32}px`)
                zIndex: obj.gridPosition.x + obj.gridPosition.y + 10,
              }}
              onClick={() => handleTileClick(obj.gridPosition.x, obj.gridPosition.y)}
              onDoubleClick={() => onSelectObject(obj)}
              title={`${obj.name} (Clique duplo para abrir)`}
            />
          );
        })}

      </div>
    </div>
  );
};