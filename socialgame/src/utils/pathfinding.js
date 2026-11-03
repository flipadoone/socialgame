const keyOf = ({ x, y }) => `${x},${y}`;

export function findPath(start, target, gridRows, gridCols, blockedTiles = []) {
  if (!start || !target) return [];
  if (start.x === target.x && start.y === target.y) return [];
  const blocked = new Set(blockedTiles.map(keyOf));
  const queue = [[start]], visited = new Set([keyOf(start)]);
  const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
  for (let head = 0; head < queue.length; head++) {
    const path = queue[head], current = path[path.length - 1];
    for (const dir of directions) {
      const next = { x: current.x + dir.x, y: current.y + dir.y };
      const key = keyOf(next);
      if (next.x < 0 || next.x >= gridCols || next.y < 0 || next.y >= gridRows) continue;
      if (blocked.has(key) && key !== keyOf(target)) continue;
      if (visited.has(key)) continue;
      if (key === keyOf(target)) return [...path.slice(1), next];
      visited.add(key); queue.push([...path, next]);
    }
  }
  return [];
}

export function getBlockedTiles(roomObjects) {
  return roomObjects.filter(o => !o.walkable && o.type !== 'wall_decor').flatMap(obj => {
    const tiles = [];
    for (let x = 0; x < (obj.tileWidth || 1); x++)
      for (let y = 0; y < (obj.tileHeight || 1); y++)
        tiles.push({ x: obj.gridPosition.x + x, y: obj.gridPosition.y + y });
    return tiles;
  });
}

export function isAvatarNearObject(avatarPos, obj) {
  const w = obj.tileWidth || 1, h = obj.tileHeight || 1;
  for (let x = obj.gridPosition.x; x < obj.gridPosition.x + w; x++)
    for (let y = obj.gridPosition.y; y < obj.gridPosition.y + h; y++)
      if (Math.abs(avatarPos.x - x) <= 1 && Math.abs(avatarPos.y - y) <= 1) return true;
  return false;
}

export function getBestNeighborTile(avatarPos, obj, gridRows, gridCols, blockedTiles = []) {
  const w = obj.tileWidth || 1, h = obj.tileHeight || 1;
  const blocked = new Set(blockedTiles.map(keyOf)), candidates = [];
  for (let x = obj.gridPosition.x - 1; x <= obj.gridPosition.x + w; x++)
    for (let y = obj.gridPosition.y - 1; y <= obj.gridPosition.y + h; y++) {
      const inside = x >= obj.gridPosition.x && x < obj.gridPosition.x + w && y >= obj.gridPosition.y && y < obj.gridPosition.y + h;
      if (x < 0 || x >= gridCols || y < 0 || y >= gridRows || inside || blocked.has(`${x},${y}`)) continue;
      candidates.push({ x, y, dist: Math.abs(avatarPos.x - x) + Math.abs(avatarPos.y - y) });
    }
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates[0] ? { x: candidates[0].x, y: candidates[0].y } : null;
}
