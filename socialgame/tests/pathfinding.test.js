import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, getBlockedSet, getBestNeighborTile, isAvatarNearObject } from '../src/utils/pathfinding.js';

const desk = { id: 'desk', gridPosition: { x: 3, y: 2 }, tileWidth: 2, tileHeight: 2, walkable: false };

test('getBlockedSet marca toda a área do móvel e ignora móveis caminháveis e de parede', () => {
  const blocked = getBlockedSet([
    desk,
    { id: 'chair', gridPosition: { x: 0, y: 0 }, walkable: true },
    { id: 'postit', gridPosition: { x: 0, y: 4 }, type: 'wall_decor' },
  ]);
  assert.deepEqual([...blocked].sort(), ['3,2', '3,3', '4,2', '4,3']);
});

test('findPath devolve o menor caminho, sem incluir a casa inicial', () => {
  const path = findPath({ x: 0, y: 0 }, { x: 3, y: 0 }, 9, 9);
  assert.deepEqual(path, [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]);
});

test('findPath contorna obstáculos', () => {
  const blocked = getBlockedSet([desk]);
  const path = findPath({ x: 3, y: 1 }, { x: 3, y: 4 }, 9, 9, blocked);
  assert.ok(path.length > 3, 'precisa dar a volta');
  assert.ok(path.every(step => !blocked.has(`${step.x},${step.y}`)));
  assert.deepEqual(path.at(-1), { x: 3, y: 4 });
});

test('findPath devolve [] quando não há caminho, destino fora da sala ou destino = origem', () => {
  const wall = new Set(['1,0', '1,1', '0,1']);
  assert.deepEqual(findPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 9, 9, wall), []);
  assert.deepEqual(findPath({ x: 0, y: 0 }, { x: 9, y: 0 }, 9, 9), []);
  assert.deepEqual(findPath({ x: 2, y: 2 }, { x: 2, y: 2 }, 9, 9), []);
});

test('o destino pode ser uma casa bloqueada (sentar/interagir)', () => {
  const path = findPath({ x: 0, y: 0 }, { x: 1, y: 0 }, 9, 9, new Set(['1,0']));
  assert.deepEqual(path, [{ x: 1, y: 0 }]);
});

test('desempenho: sala grande resolve rápido', () => {
  const start = performance.now();
  for (let i = 0; i < 200; i++) findPath({ x: 0, y: 0 }, { x: 39, y: 39 }, 40, 40);
  assert.ok(performance.now() - start < 1500);
});

test('vizinhança e proximidade de móveis', () => {
  assert.equal(isAvatarNearObject({ x: 2, y: 2 }, desk), true);
  assert.equal(isAvatarNearObject({ x: 8, y: 8 }, desk), false);
  const tile = getBestNeighborTile({ x: 0, y: 0 }, desk, 9, 9, getBlockedSet([desk]));
  assert.ok(tile && !getBlockedSet([desk]).has(`${tile.x},${tile.y}`));
});
