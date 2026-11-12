const keyOf = (x, y) => `${x},${y}`;
const DIRECTIONS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

/** Conjunto de casas ocupadas por móveis não caminháveis (consulta O(1)). */
export function getBlockedSet(roomObjects) {
  const blocked = new Set();
  for (const obj of roomObjects) {
    if (obj.walkable || obj.type === 'wall_decor') continue;
    for (let x = 0; x < (obj.tileWidth || 1); x++)
      for (let y = 0; y < (obj.tileHeight || 1); y++)
        blocked.add(keyOf(obj.gridPosition.x + x, obj.gridPosition.y + y));
  }
  return blocked;
}

/**
 * Busca em largura com mapa de "pais": reconstrói o caminho no final em vez de copiar
 * o caminho inteiro a cada casa visitada. A casa de destino é sempre permitida
 * (útil para sentar/interagir com móveis).
 */
export function findPath(start, target, rows, cols, blocked = new Set()) {
  if (!start || !target) return [];
  if (start.x === target.x && start.y === target.y) return [];
  if (target.x < 0 || target.x >= cols || target.y < 0 || target.y >= rows) return [];

  const targetKey = keyOf(target.x, target.y);
  const parents = new Map([[keyOf(start.x, start.y), null]]);
  const queue = [start];

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const [dx, dy] of DIRECTIONS) {
      const x = current.x + dx, y = current.y + dy;
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
      const key = keyOf(x, y);
      if (parents.has(key)) continue;
      if (blocked.has(key) && key !== targetKey) continue;
      parents.set(key, current);
      if (key === targetKey) {
        const path = [];
        for (let node = { x, y }; node && !(node.x === start.x && node.y === start.y); node = parents.get(keyOf(node.x, node.y))) path.push(node);
        return path.reverse();
      }
      queue.push({ x, y });
    }
  }
  return [];
}

export function isAvatarNearObject(avatarPos, obj) {
  const w = obj.tileWidth || 1, h = obj.tileHeight || 1;
  for (let x = obj.gridPosition.x; x < obj.gridPosition.x + w; x++)
    for (let y = obj.gridPosition.y; y < obj.gridPosition.y + h; y++)
      if (Math.abs(avatarPos.x - x) <= 1 && Math.abs(avatarPos.y - y) <= 1) return true;
  return false;
}

export function getBestNeighborTile(avatarPos, obj, rows, cols, blocked = new Set()) {
  const w = obj.tileWidth || 1, h = obj.tileHeight || 1;
  let best = null;
  for (let x = obj.gridPosition.x - 1; x <= obj.gridPosition.x + w; x++)
    for (let y = obj.gridPosition.y - 1; y <= obj.gridPosition.y + h; y++) {
      const inside = x >= obj.gridPosition.x && x < obj.gridPosition.x + w && y >= obj.gridPosition.y && y < obj.gridPosition.y + h;
      if (x < 0 || x >= cols || y < 0 || y >= rows || inside || blocked.has(keyOf(x, y))) continue;
      const dist = Math.abs(avatarPos.x - x) + Math.abs(avatarPos.y - y);
      if (!best || dist < best.dist) best = { x, y, dist };
    }
  return best ? { x: best.x, y: best.y } : null;
}
