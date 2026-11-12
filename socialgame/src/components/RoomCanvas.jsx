import { memo, useEffect, useMemo, useRef } from 'react';
import { TILE_HEIGHT, TILE_WIDTH, ROOM_ASSETS } from '../config/roomConstants';
import { getAvatarSprite } from '../config/skins';
import { getIsoCoords } from '../utils/isoMath.jsx';

const WALL_HEIGHT = 150;

function computeGeometry({ rows, cols }) {
  const width = (rows + cols) * TILE_WIDTH / 2 + TILE_WIDTH;
  const height = (rows + cols) * TILE_HEIGHT / 2 + 180;
  const roomCenterX = width / 2;
  const floorOriginY = (rows * TILE_HEIGHT / 2 + 120) / 2;
  const back = { x: roomCenterX, y: floorOriginY };
  return {
    width, height, roomCenterX, floorOriginY,
    back,
    left: { x: roomCenterX - rows * TILE_WIDTH / 2, y: floorOriginY + rows * TILE_HEIGHT / 2 },
    right: { x: roomCenterX + cols * TILE_WIDTH / 2, y: floorOriginY + cols * TILE_HEIGHT / 2 },
    wallTopY: back.y - WALL_HEIGHT,
  };
}

const Walls = memo(function Walls({ geo, graffitiData }) {
  const { back, left, right, width, height, wallTopY } = geo;
  const leftPts = `${back.x},${wallTopY} ${left.x},${wallTopY + (left.y - back.y)} ${left.x},${left.y} ${back.x},${back.y}`;
  const rightPts = `${back.x},${wallTopY} ${right.x},${wallTopY + (right.y - back.y)} ${right.x},${right.y} ${back.x},${back.y}`;
  return (
    <svg className="pointer-events-none absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ zIndex: 2, overflow: 'visible' }} aria-hidden="true">
      <defs><clipPath id="room-right-wall-clip"><polygon points={rightPts} /></clipPath></defs>
      <polygon points={leftPts} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
      <polygon points={rightPts} fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
      {graffitiData && (
        <image href={graffitiData} x={back.x} y={wallTopY} width={right.x - back.x} height={WALL_HEIGHT + (right.y - back.y)}
          preserveAspectRatio="none" clipPath="url(#room-right-wall-clip)" opacity="0.9" />
      )}
    </svg>
  );
});

const FloorTile = memo(function FloorTile({ x, y, roomCenterX, floorOriginY, editing, onTileClick }) {
  const p = getIsoCoords(x, y);
  return (
    <button
      onClick={() => onTileClick(x, y)}
      aria-label={`Casa ${x},${y}`}
      className="group absolute cursor-pointer"
      style={{ left: p.x + roomCenterX - TILE_WIDTH / 2, top: p.y + floorOriginY, width: TILE_WIDTH, height: TILE_HEIGHT, zIndex: x + y + 20 }}
    >
      <svg viewBox="0 0 64 32" className="h-full w-full drop-shadow-sm">
        <polygon points="32,0 64,16 32,32 0,16" className={`fill-slate-800 stroke-slate-700/60 ${editing ? 'group-hover:fill-emerald-600/70' : 'group-hover:fill-indigo-700/60'}`} />
      </svg>
      <img src={ROOM_ASSETS.floor} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
        onError={event => { event.currentTarget.style.display = 'none'; }} />
    </button>
  );
});

const Furniture = memo(function Furniture({ obj, geo, selected, isRootUser, onObjectClick, onObjectDoubleClick }) {
  const p = getIsoCoords(obj.gridPosition.x, obj.gridPosition.y);
  const wall = obj.type === 'wall_decor';
  const postit = obj.actionType === 'POSTIT' || obj.id.includes('postit');
  const tileWidth = obj.tileWidth || 1;
  const tileHeight = obj.tileHeight || 1;
  const visualWidth = (tileWidth + tileHeight) * TILE_WIDTH / 2;
  // gridPosition é o canto lógico da área ocupada; o sprite fica centralizado nela e apoiado no vértice frontal.
  const footprintCenterX = p.x + (tileWidth - tileHeight) * TILE_WIDTH / 4;
  const footprintBottomY = p.y + geo.floorOriginY + (tileWidth + tileHeight - 2) * TILE_HEIGHT / 2 + TILE_HEIGHT;
  const renderHeight = obj.renderHeight || 48;
  const wallShift = postit ? (obj.gridPosition.x === 0 ? 12 : -12) : 0;
  const top = footprintBottomY - renderHeight + (wall ? (obj.offsetY ?? -65) : (obj.offsetY || 0));
  const transform = postit
    ? (obj.gridPosition.x === 0 ? 'rotate(-26deg) skewX(30deg) scale(.85)' : 'rotate(26deg) skewX(-30deg) scale(.85)')
    : `scaleX(${obj.rotation || 1})`;

  return (
    <div
      onClick={() => onObjectClick(obj)}
      onDoubleClick={() => onObjectDoubleClick(obj)}
      title={obj.actionType === 'TALKTOME' ? `${obj.name}: clique para conversar` : `${obj.name} (duplo clique para interagir)`}
      className={`absolute flex cursor-pointer flex-col items-center justify-end transition-transform hover:scale-105 ${selected && isRootUser ? 'rounded-lg bg-indigo-500/20 ring-2 ring-indigo-400' : ''}`}
      style={{
        left: footprintCenterX + geo.roomCenterX - visualWidth / 2 + wallShift, top, width: visualWidth, height: renderHeight,
        zIndex: wall ? 30 + obj.gridPosition.x + obj.gridPosition.y : (obj.gridPosition.x + obj.gridPosition.y) * 10 + 50,
      }}
    >
      {!wall && <div className="pointer-events-none absolute bottom-1 h-3 w-4/5 rounded-full bg-black/60 blur-[1px]" />}
      <img src={obj.sprite} alt={obj.name} draggable={false} className={`relative z-10 h-full w-full origin-center object-contain ${obj.actionType === 'TALKTOME' ? 'animate-float' : ''}`}
        style={{ transform, imageRendering: 'pixelated' }} onError={event => { event.currentTarget.style.display = 'none'; }} />
    </div>
  );
});

const PlayerAvatar = memo(function PlayerAvatar({ player, geo, self = false, bubble = '' }) {
  const { x, y, dir, isWalking, isSitting, name, isRoot, skin } = player;
  const iso = getIsoCoords(x, y);
  const baseY = iso.y + geo.floorOriginY + TILE_HEIGHT;
  const sprite = getAvatarSprite(skin, dir, isWalking);

  return (
    <div
      className="pointer-events-none absolute flex flex-col items-center justify-end transition-all duration-[280ms] ease-linear"
      style={{ left: iso.x + geo.roomCenterX - 32, top: baseY - 110 + (isSitting ? 8 : 0), width: 64, height: 110, zIndex: (x + y) * 10 + 200 + (self ? 1 : 0) }}
    >
      {bubble && (
        <span className="absolute -top-14 left-1/2 z-30 w-max max-w-[150px] -translate-x-1/2 break-words rounded-xl border border-slate-300 bg-white px-2 py-1 text-center text-[11px] font-medium leading-tight text-slate-900 shadow-lg">
          {bubble.slice(0, 90)}
        </span>
      )}
      {name && (
        <span className={`absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold ${self ? 'bg-indigo-600/90 text-white' : 'bg-slate-900/85 text-slate-100'}`}>
          {isRoot ? '★ ' : ''}{name}{self ? ' (você)' : ''}
        </span>
      )}
      <div className="pointer-events-none absolute bottom-1 h-2.5 w-8 rounded-full bg-black/70 blur-[1px]" />
      <img
        src={sprite.src}
        alt={`Avatar de ${name || 'jogador'}`}
        draggable={false}
        decoding="async"
        className={`relative z-10 h-full w-full object-contain ${sprite.bob ? 'animate-walk-bob' : ''}`}
        style={{ imageRendering: 'pixelated', transform: sprite.mirrored ? 'scaleX(-1)' : undefined, filter: sprite.filter || undefined }}
      />
    </div>
  );
});

export default memo(function RoomCanvas({
  roomSize, roomObjects, selfPlayer, otherPlayers, bubbles, graffitiData, selectedObjectId,
  isRootUser, editing, zoomLevel, onTileClick, onObjectClick, onObjectDoubleClick, onZoomDelta,
}) {
  const geo = useMemo(() => computeGeometry(roomSize), [roomSize]);
  const containerRef = useRef(null);
  const zoomRef = useRef(onZoomDelta);
  zoomRef.current = onZoomDelta;

  // Listener nativo não-passivo: o onWheel do React é passivo e não permite preventDefault.
  useEffect(() => {
    const element = containerRef.current;
    const handler = event => { event.preventDefault(); zoomRef.current(event.deltaY < 0 ? 0.1 : -0.1); };
    element.addEventListener('wheel', handler, { passive: false });
    return () => element.removeEventListener('wheel', handler);
  }, []);

  const tiles = useMemo(
    () => Array.from({ length: roomSize.rows * roomSize.cols }, (_, i) => ({ x: i % roomSize.cols, y: Math.floor(i / roomSize.cols) })),
    [roomSize],
  );

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-auto bg-slate-950 p-6">
      <div className="relative shrink-0" style={{ width: geo.width, height: geo.height, transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
        <Walls geo={geo} graffitiData={graffitiData} />
        {tiles.map(({ x, y }) => (
          <FloorTile key={`${x}-${y}`} x={x} y={y} roomCenterX={geo.roomCenterX} floorOriginY={geo.floorOriginY} editing={editing} onTileClick={onTileClick} />
        ))}
        {roomObjects.map(obj => (
          <Furniture key={obj.id} obj={obj} geo={geo} selected={selectedObjectId === obj.id} isRootUser={isRootUser} onObjectClick={onObjectClick} onObjectDoubleClick={onObjectDoubleClick} />
        ))}
        {otherPlayers.map(player => (
          <PlayerAvatar key={player.id} player={player} geo={geo} bubble={bubbles[player.id]} />
        ))}
        <PlayerAvatar self player={selfPlayer} geo={geo} bubble={bubbles[selfPlayer.id]} />
      </div>
    </div>
  );
});
