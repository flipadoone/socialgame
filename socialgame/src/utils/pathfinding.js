export function findPath(start, target, gridRows, gridCols, blockedTiles = []) {
  const queue = [[start]];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);

  const directions = [
    { x: 0, y: -1 }, // Cima
    { x: 0, y: 1 },  // Baixo
    { x: -1, y: 0 }, // Esquerda
    { x: 1, y: 0 },  // Direita
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