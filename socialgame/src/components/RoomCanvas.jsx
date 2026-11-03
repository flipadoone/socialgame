import { TILE_HEIGHT, TILE_WIDTH, ROOM_ASSETS, AVATAR_IDLE_SPRITES, AVATAR_WALK_SPRITES } from '../config/roomConstants';
import { getIsoCoords } from '../utils/isoMath.jsx';

const WALL_HEIGHT = 150;

export default function RoomCanvas({
  roomSize, roomObjects, avatarPos, avatarDir, isWalking, isSitting, graffitiData,
  selectedObject, isRootUser, placingItem, movingObjId, zoomLevel,
  onTileClick, onObjectClick, onObjectDoubleClick, onWheelZoom,
}) {
  const width = (roomSize.rows + roomSize.cols) * TILE_WIDTH / 2 + TILE_WIDTH;
  const height = (roomSize.rows + roomSize.cols) * TILE_HEIGHT / 2 + 180;
  const roomCenterX = width / 2;
  const wallDepth = roomSize.rows * TILE_HEIGHT / 2 + 120;
  const floorOriginY = wallDepth / 2;
  const floorBack = { x: roomCenterX, y: floorOriginY };
  const floorLeft = { x: roomCenterX - roomSize.rows * TILE_WIDTH / 2, y: floorOriginY + roomSize.rows * TILE_HEIGHT / 2 };
  const floorRight = { x: roomCenterX + roomSize.cols * TILE_WIDTH / 2, y: floorOriginY + roomSize.cols * TILE_HEIGHT / 2 };
  const floorFront = { x: roomCenterX, y: floorOriginY + (roomSize.rows + roomSize.cols) * TILE_HEIGHT / 2 };
  const wallTopY = floorBack.y - WALL_HEIGHT;
  const avatar = getIsoCoords(avatarPos.x, avatarPos.y);
  const avatarBaseY = avatar.y + floorOriginY + TILE_HEIGHT;
  const sprite = isWalking
    ? (AVATAR_WALK_SPRITES[avatarDir] || AVATAR_IDLE_SPRITES[avatarDir])
    : AVATAR_IDLE_SPRITES[avatarDir];

  return (
    <div onWheel={onWheelZoom} className="flex h-full w-full items-center justify-center overflow-auto bg-slate-950 p-6">
      <div
        className="relative shrink-0"
        style={{ width, height, transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        {/* Paredes ancoradas exatamente nas duas arestas traseiras do piso. */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ zIndex: 2, overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="habbo-right-wall-clip">
              <polygon points={`${floorBack.x},${wallTopY} ${floorRight.x},${wallTopY + (floorRight.y - floorBack.y)} ${floorRight.x},${floorRight.y} ${floorBack.x},${floorBack.y}`} />
            </clipPath>
          </defs>
          <polygon
            points={`${floorBack.x},${wallTopY} ${floorLeft.x},${wallTopY + (floorLeft.y - floorBack.y)} ${floorLeft.x},${floorLeft.y} ${floorBack.x},${floorBack.y}`}
            fill="#cbd5e1"
            stroke="#94a3b8"
            strokeWidth="2"
          />
          <polygon
            points={`${floorBack.x},${wallTopY} ${floorRight.x},${wallTopY + (floorRight.y - floorBack.y)} ${floorRight.x},${floorRight.y} ${floorBack.x},${floorBack.y}`}
            fill="#94a3b8"
            stroke="#64748b"
            strokeWidth="2"
          />
          {graffitiData && (
            <image
              href={graffitiData}
              x={floorBack.x}
              y={wallTopY}
              width={floorRight.x - floorBack.x}
              height={WALL_HEIGHT + (floorRight.y - floorBack.y)}
              preserveAspectRatio="none"
              clipPath="url(#habbo-right-wall-clip)"
              opacity="0.9"
            />
          )}
        </svg>

        {Array.from({ length: roomSize.rows }, (_, y) =>
          Array.from({ length: roomSize.cols }, (_, x) => {
            const p = getIsoCoords(x, y);
            return (
              <button
                key={`${x}-${y}`}
                onClick={() => onTileClick(x, y)}
                aria-label={`Tile ${x},${y}`}
                className="group absolute cursor-pointer"
                style={{
                  left: p.x + roomCenterX - TILE_WIDTH / 2,
                  top: p.y + floorOriginY,
                  width: TILE_WIDTH,
                  height: TILE_HEIGHT,
                  zIndex: x + y + 20,
                }}
              >
                <svg viewBox="0 0 64 32" className="h-full w-full drop-shadow-sm">
                  <polygon
                    points="32,0 64,16 32,32 0,16"
                    className={`stroke-slate-700/60 ${placingItem || movingObjId ? 'fill-slate-800 group-hover:fill-emerald-600/70' : 'fill-slate-800 group-hover:fill-indigo-700/60'}`}
                  />
                </svg>
                <img
                  src={ROOM_ASSETS.floor}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
                  onError={event => { event.currentTarget.style.display = 'none'; }}
                />
              </button>
            );
          }),
        )}

        {roomObjects.map(obj => {
          const p = getIsoCoords(obj.gridPosition.x, obj.gridPosition.y);
          const wall = obj.type === 'wall_decor';
          const postit = obj.actionType === 'POSTIT' || obj.id.includes('postit');
          const tileWidth = obj.tileWidth || 1;
          const tileHeight = obj.tileHeight || 1;
          const visualWidth = (tileWidth + tileHeight) * TILE_WIDTH / 2;
          // gridPosition representa o canto lógico da área ocupada pelo móvel.
          // O sprite é centralizado na área e apoiado no vértice frontal da footprint.
          const footprintCenterX = p.x + (tileWidth - tileHeight) * TILE_WIDTH / 4;
          const footprintBottomY = p.y + floorOriginY + (tileWidth + tileHeight - 2) * TILE_HEIGHT / 2 + TILE_HEIGHT;
          const renderHeight = obj.renderHeight || 48;
          const wallShift = postit ? (obj.gridPosition.x === 0 ? 12 : -12) : 0;
          const top = footprintBottomY - renderHeight + (wall ? (obj.offsetY ?? -65) : (obj.offsetY || 0));
          const transform = postit
            ? (obj.gridPosition.x === 0 ? 'rotate(-26deg) skewX(30deg) scale(.85)' : 'rotate(26deg) skewX(-30deg) scale(.85)')
            : `scaleX(${obj.rotation || 1})`;

          return (
            <div
              key={obj.id}
              onClick={() => onObjectClick(obj)}
              onDoubleClick={() => onObjectDoubleClick(obj)}
              title={`${obj.name} (duplo clique para interagir)`}
              className={`absolute flex cursor-pointer flex-col items-center justify-end transition-transform hover:scale-105 ${selectedObject?.id === obj.id && isRootUser ? 'rounded-lg bg-indigo-500/20 ring-2 ring-indigo-400' : ''}`}
              style={{
                left: footprintCenterX + roomCenterX - visualWidth / 2 + wallShift,
                top,
                width: visualWidth,
                height: renderHeight,
                zIndex: wall ? 30 + obj.gridPosition.x + obj.gridPosition.y : (obj.gridPosition.x + obj.gridPosition.y) * 10 + 50,
              }}
            >
              {!wall && <div className="pointer-events-none absolute bottom-1 h-3 w-4/5 rounded-full bg-black/60 blur-[1px]" />}
              <img
                src={obj.sprite}
                alt={obj.name}
                className="relative z-10 h-full w-full origin-center object-contain"
                style={{ transform, imageRendering: 'pixelated' }}
                onError={event => { event.currentTarget.style.display = 'none'; }}
              />
            </div>
          );
        })}

        <div
          className="pointer-events-none absolute flex flex-col items-center justify-end transition-all duration-[280ms] ease-linear"
          style={{
            left: avatar.x + roomCenterX - 32,
            top: avatarBaseY - 110 + (isSitting ? 8 : 0),
            width: 64,
            height: 110,
            zIndex: (avatarPos.x + avatarPos.y) * 10 + 200,
          }}
        >
          <div className="pointer-events-none absolute bottom-1 h-2.5 w-8 rounded-full bg-black/70 blur-[1px]" />
          <img
            src={sprite || '/assets/persona/avatarimage0.png'}
            alt={`Avatar direção ${avatarDir}`}
            className="relative z-10 h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
            onError={event => { event.currentTarget.src = AVATAR_IDLE_SPRITES[avatarDir] || '/assets/persona/avatarimage0.png'; }}
          />
        </div>
      </div>
    </div>
  );
}
