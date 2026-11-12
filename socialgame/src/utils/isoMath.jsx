import { TILE_HEIGHT, TILE_WIDTH } from '../config/roomConstants';

export function getIsoCoords(x, y) {
  return { x: (x - y) * (TILE_WIDTH / 2), y: (x + y) * (TILE_HEIGHT / 2) };
}

export function getDirection(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (dx === 0 && dy < 0) return 0;
  if (dx > 0 && dy < 0) return 1;
  if (dx > 0 && dy === 0) return 2;
  if (dx > 0 && dy > 0) return 3;
  if (dx === 0 && dy > 0) return 4;
  if (dx < 0 && dy > 0) return 5;
  if (dx < 0 && dy === 0) return 6;
  if (dx < 0 && dy < 0) return 7;
  return 4;
}
