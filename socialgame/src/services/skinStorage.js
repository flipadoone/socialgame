import { MAX_CUSTOM_SKINS, DEFAULT_SKIN_ID } from '../config/skins';

/** Persistência (por usuário) e criação de skins personalizadas a partir de imagens enviadas. */
const skinsKey = userId => `nemo_skins_v1:${userId}`;
const selectedKey = userId => `nemo_skin_selected:${userId}`;

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_SPRITE_CHARS = 60000;     // tamanho máximo de cada imagem (data URL)
const MAX_SKIN_CHARS = 320000;      // tamanho máximo da skin inteira
const MAX_SPRITE_SIZE = { width: 128, height: 220 };
const ALLOWED_TYPES = ['image/png', 'image/webp', 'image/gif', 'image/jpeg'];

export function loadCustomSkins(userId) {
  try {
    const list = JSON.parse(localStorage.getItem(skinsKey(userId)) || '[]');
    return Array.isArray(list)
      ? list.filter(skin => skin?.kind === 'custom' && skin.id && skin.images).slice(0, MAX_CUSTOM_SKINS)
      : [];
  } catch {
    return [];
  }
}

export function saveCustomSkins(userId, skins) {
  try {
    localStorage.setItem(skinsKey(userId), JSON.stringify(skins));
    return true;
  } catch {
    return false; // cota do navegador estourada
  }
}

export const loadSelectedSkinId = userId => localStorage.getItem(selectedKey(userId)) || DEFAULT_SKIN_ID;
export function saveSelectedSkinId(userId, id) {
  try { localStorage.setItem(selectedKey(userId), id); } catch { /* ignora */ }
}

/** Reduz e converte a imagem para PNG leve (mantém transparência). Só usa o 1º quadro de GIFs. */
async function fileToSprite(file) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error(`"${file.name}": use PNG, WebP, GIF ou JPEG.`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.name}" tem mais de 3 MB.`);

  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error(`"${file.name}" não é uma imagem válida.`); }

  let scale = Math.min(1, MAX_SPRITE_SIZE.width / bitmap.width, MAX_SPRITE_SIZE.height / bitmap.height);
  for (let attempt = 0; attempt < 5; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length <= MAX_SPRITE_CHARS) { bitmap.close?.(); return dataUrl; }
    scale *= 0.75;
  }
  bitmap.close?.();
  throw new Error(`"${file.name}" é complexa demais. Use uma imagem menor ou mais simples.`);
}

/**
 * Descobre o papel de cada arquivo pelo nome:
 *   ...walking3.png / walk_3.png  -> andando, direção 3
 *   ...avatarimage3.png / idle3   -> parado, direção 3
 */
function classify(fileName) {
  const base = fileName.toLowerCase().replace(/\.[a-z0-9]+$/, '');
  const digit = base.match(/([0-7])(?!.*\d)/);
  if (!digit) return null;
  return { kind: /walk|andand|caminh/.test(base) ? 'walk' : 'idle', dir: Number(digit[1]) };
}

/**
 * Cria uma skin a partir de arquivos de imagem.
 *  - 1 arquivo  -> imagem única, usada em todas as direções.
 *  - vários     -> conjunto por direção (nomes como avatarimage0..6.png e avatarimagewalking0..6.png).
 */
export async function buildSkinFromFiles(files, rawName) {
  const list = [...files];
  if (list.length === 0) throw new Error('Escolha pelo menos uma imagem.');
  if (list.length > 16) throw new Error('Envie no máximo 16 imagens por skin.');

  const name = String(rawName || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 24)
    || list[0].name.replace(/\.[^.]+$/, '').slice(0, 24);
  const images = {};

  if (list.length === 1) {
    images.single = await fileToSprite(list[0]);
  } else {
    const unknown = list.filter(file => !classify(file.name)).map(file => file.name);
    if (unknown.length) {
      throw new Error(`Não consegui identificar a direção (0 a 7) em: ${unknown.join(', ')}. Use nomes como avatarimage0.png e avatarimagewalking0.png.`);
    }
    images.idle = {};
    images.walk = {};
    for (const file of list) {
      const { kind, dir } = classify(file.name);
      images[kind][dir] = await fileToSprite(file);
    }
    if (Object.keys(images.idle).length === 0) throw new Error('Inclua ao menos uma imagem de personagem parado (ex.: avatarimage4.png).');
    if (Object.keys(images.walk).length === 0) delete images.walk;
  }

  const total = JSON.stringify(images).length;
  if (total > MAX_SKIN_CHARS) throw new Error('Essa skin ficou grande demais. Use menos imagens ou imagens mais simples.');

  return { id: `custom-${crypto.randomUUID()}`, kind: 'custom', name, images };
}
