import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SKIN_ID, SKIN_PRESETS, getAvatarSprite, normalizeSkin, skinToPayload } from '../src/config/skins.js';

const preset = id => SKIN_PRESETS.find(skin => skin.id === id);

test('skin padrão usa os sprites do jogo, sem filtro', () => {
  const sprite = getAvatarSprite(preset('default'), 4, false);
  assert.equal(sprite.src, '/assets/persona/avatarimage4.png');
  assert.equal(sprite.filter, '');
  assert.equal(sprite.mirrored, false);
});

test('andando usa o sprite animado; a direção 7 espelha a 1', () => {
  assert.equal(getAvatarSprite(preset('default'), 2, true).src, '/assets/persona/avatarimagewalking2.png');
  const seven = getAvatarSprite(preset('default'), 7, false);
  assert.equal(seven.src, '/assets/persona/avatarimage1.png');
  assert.equal(seven.mirrored, true);
});

test('presets de cor aplicam filtro', () => {
  assert.match(getAvatarSprite(preset('noir'), 4, false).filter, /grayscale/);
});

test('skin própria de imagem única vale para todas as direções e espelha para a esquerda', () => {
  const skin = { id: 'custom-1', kind: 'custom', name: 'X', images: { single: 'data:image/png;base64,AAAA' } };
  assert.equal(getAvatarSprite(skin, 1, false).mirrored, false);
  assert.equal(getAvatarSprite(skin, 6, false).mirrored, true);
  assert.equal(getAvatarSprite(skin, 3, false).src, skin.images.single);
  assert.equal(getAvatarSprite(skin, 3, true).bob, true, 'sem sprite de caminhada, balança');
});

test('skin própria com conjunto usa o sprite de caminhada quando existe', () => {
  const skin = { id: 'custom-2', kind: 'custom', name: 'Y', images: { idle: { 4: 'idle4', 1: 'idle1' }, walk: { 4: 'walk4' } } };
  assert.equal(getAvatarSprite(skin, 4, true).src, 'walk4');
  assert.equal(getAvatarSprite(skin, 4, true).bob, false);
  assert.equal(getAvatarSprite(skin, 4, false).src, 'idle4');
  const missing = getAvatarSprite(skin, 7, false);
  assert.equal(missing.src, 'idle1');
  assert.equal(missing.mirrored, true);
});

test('normalizeSkin cai na padrão para dados desconhecidos e skinToPayload só envia imagens das próprias', () => {
  assert.equal(normalizeSkin({ id: 'nao-existe' }).id, DEFAULT_SKIN_ID);
  assert.equal(normalizeSkin(null).id, DEFAULT_SKIN_ID);
  assert.deepEqual(skinToPayload(preset('ocean')), { id: 'ocean', kind: 'preset' });
  const custom = { id: 'custom-3', kind: 'custom', name: 'Z', images: { single: 'x' } };
  assert.deepEqual(skinToPayload(custom).images, { single: 'x' });
});
