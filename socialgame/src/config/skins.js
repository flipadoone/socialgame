/**
 * Skins do personagem.
 *  - preset: usa os sprites padrão (/assets/persona) com um filtro de cor (CSS).
 *  - custom: imagens enviadas pelo jogador (guardadas no navegador e sincronizadas na sala).
 *      images = { single?: dataURL, idle?: {0..7: dataURL}, walk?: {0..7: dataURL} }
 */
export const DEFAULT_SKIN_ID = 'default';

export const SKIN_PRESETS = [
  { id: 'default', kind: 'preset', name: 'Padrão', filter: '' },
  { id: 'ocean', kind: 'preset', name: 'Oceano', filter: 'hue-rotate(160deg) saturate(1.2)' },
  { id: 'forest', kind: 'preset', name: 'Floresta', filter: 'hue-rotate(80deg) saturate(1.1)' },
  { id: 'violet', kind: 'preset', name: 'Violeta', filter: 'hue-rotate(250deg) saturate(1.3)' },
  { id: 'sunset', kind: 'preset', name: 'Pôr do sol', filter: 'hue-rotate(320deg) saturate(1.4) brightness(1.05)' },
  { id: 'gold', kind: 'preset', name: 'Dourado', filter: 'sepia(1) saturate(2.2) hue-rotate(-10deg)' },
  { id: 'noir', kind: 'preset', name: 'Noir', filter: 'grayscale(1) contrast(1.2)' },
  { id: 'ghost', kind: 'preset', name: 'Fantasma', filter: 'grayscale(.6) brightness(1.5) opacity(.85)' },
];

const PRESETS_BY_ID = new Map(SKIN_PRESETS.map(skin => [skin.id, skin]));

// Existem imagens base para as direções 0 a 6; a direção 7 espelha a 1.
const BASE_DIRECTIONS = 7;
const baseIdle = dir => `/assets/persona/avatarimage${dir}.png`;
const baseWalk = dir => `/assets/persona/avatarimagewalking${dir}.png`;

export const MAX_CUSTOM_SKINS = 8;

/** Converte o que veio da rede/disco em uma skin utilizável (ou a padrão se for inválido). */
export function normalizeSkin(raw) {
  if (raw?.kind === 'custom' && raw.images && typeof raw.images === 'object') {
    return { id: String(raw.id), kind: 'custom', name: String(raw.name || 'Skin'), images: raw.images };
  }
  return PRESETS_BY_ID.get(raw?.id) ?? PRESETS_BY_ID.get(DEFAULT_SKIN_ID);
}

/** O que enviamos aos outros jogadores: presets só pelo id; skins próprias com as imagens. */
export const skinToPayload = skin =>
  skin.kind === 'custom'
    ? { id: skin.id, kind: 'custom', name: skin.name, images: skin.images }
    : { id: skin.id, kind: 'preset' };

/**
 * Decide qual imagem mostrar para a skin, direção e estado.
 * Retorna { src, mirrored, bob, filter }:
 *  - mirrored: inverte horizontalmente (direção 7 e skins de imagem única virando para a esquerda);
 *  - bob: balanço de caminhada para skins sem sprite de caminhada próprio.
 */
export function getAvatarSprite(skin, dir, walking) {
  const d = Number.isInteger(dir) && dir >= 0 && dir <= 7 ? dir : 4;

  if (skin?.kind === 'custom') {
    const { single, idle = {}, walk = {} } = skin.images || {};
    const hasSet = Object.keys(idle).length > 0 || Object.keys(walk).length > 0;
    let mirrored = false;
    let key = d;
    if (hasSet && idle[d] == null && walk[d] == null && d === 7 && (idle[1] != null || walk[1] != null)) {
      key = 1;
      mirrored = true;
    }
    const walkSrc = walking ? walk[key] : null;
    const src = walkSrc ?? idle[key] ?? single ?? idle[4] ?? Object.values(idle)[0] ?? baseIdle(4);
    // Imagem única: vira para o lado esquerdo espelhando (direções 5, 6 e 7).
    if (!hasSet && single) mirrored = d >= 5;
    return { src, mirrored, bob: walking && !walkSrc, filter: '' };
  }

  const preset = PRESETS_BY_ID.get(skin?.id) ?? PRESETS_BY_ID.get(DEFAULT_SKIN_ID);
  const spriteDir = d < BASE_DIRECTIONS ? d : 1;
  return {
    src: walking ? baseWalk(spriteDir) : baseIdle(spriteDir),
    mirrored: spriteDir !== d,
    bob: false,
    filter: preset.filter,
  };
}
