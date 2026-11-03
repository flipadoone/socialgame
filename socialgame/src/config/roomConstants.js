export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const ROOM_ASSETS = { floor: '/assets/floor.png', wall: '/assets/wall.png' };

export const AVATAR_IDLE_SPRITES = Object.fromEntries(
  Array.from({ length: 8 }, (_, i) => [i, `/assets/persona/avatarimage${i}.png`])
);
export const AVATAR_WALK_SPRITES = Object.fromEntries(
  Array.from({ length: 8 }, (_, i) => [i, `/assets/persona/avatarimagewalking${i}.gif`])
);

export const CATALOG_ITEMS = [
  { id: 'spraycans', name: 'Latas de Spray / Graffiti', sprite: '/assets/spraycans.png', type: 'decor', tileWidth: 1, tileHeight: 1, renderHeight: 48, actionType: 'GRAFFITI' },
  { id: 'desk', name: 'Estação Dev (2x2)', sprite: '/assets/desk.png', type: 'desk', tileWidth: 2, tileHeight: 2, renderHeight: 64, apiKey: '2', actionType: 'MODAL' },
  { id: 'noticeboard', name: 'Quadro de Avisos', sprite: '/assets/noticeboard.png', type: 'decor', tileWidth: 2, tileHeight: 2, renderHeight: 80, apiKey: '1', actionType: 'MODAL' },
  { id: 'beat', name: 'Mesa Beat Studio / DAW', sprite: '/assets/beat.png', type: 'beat', tileWidth: 2, tileHeight: 2, renderHeight: 60, actionType: 'BEAT' },
  { id: 'postit', name: 'Post-it de Parede', sprite: '/assets/postit.png', type: 'wall_decor', tileWidth: 1, tileHeight: 1, renderHeight: 28, offsetY: -65, actionType: 'POSTIT' },
  { id: 'sticker', name: 'Adesivo de Chão / Conquistas', sprite: '/assets/sticker.png', type: 'decor', tileWidth: 1, tileHeight: 1, renderHeight: 32, actionType: 'ACHIEVEMENTS' },
  { id: 'chair', name: 'Cadeira Dev (1x1)', sprite: '/assets/chair.png', type: 'sit', tileWidth: 1, tileHeight: 1, renderHeight: 48, actionType: 'SIT' },
  { id: 'colchao', name: 'Colchão (2x1)', sprite: '/assets/colchao.png', type: 'sit', tileWidth: 2, tileHeight: 1, renderHeight: 60, actionType: 'SIT' },
  { id: 'fan', name: 'Ventilador (1x1)', sprite: '/assets/fan.png', type: 'decor', tileWidth: 1, tileHeight: 1, renderHeight: 48 },
  { id: 'armario', name: 'Armário (1x1)', sprite: '/assets/armario.png', type: 'decor', tileWidth: 1, tileHeight: 1, renderHeight: 76 },
  { id: 'chair2', name: 'Cadeira Gamer (1x1)', sprite: '/assets/chair2.png', type: 'sit', tileWidth: 1, tileHeight: 1, renderHeight: 50, actionType: 'SIT' },
  { id: 'desk2', name: 'Mesa Escritório (2x2)', sprite: '/assets/desk2.png', type: 'decor', tileWidth: 2, tileHeight: 2, renderHeight: 64 },
  { id: 'pilastra', name: 'Pilastra (1x1)', sprite: '/assets/pilastra.png', type: 'decor', tileWidth: 1, tileHeight: 1, renderHeight: 90 },
];

export const INITIAL_ROOM_OBJECTS = [
  { id: 'spraycans_1', ...CATALOG_ITEMS[0], gridPosition: { x: 1, y: 5 }, rotation: 1, walkable: false },
  { id: 'pc_desk', ...CATALOG_ITEMS[1], gridPosition: { x: 3, y: 2 }, rotation: 1, walkable: false },
  { id: 'beat_studio', ...CATALOG_ITEMS[3], gridPosition: { x: 5, y: 2 }, rotation: 1, walkable: false },
  { id: 'chair_dev', ...CATALOG_ITEMS[6], gridPosition: { x: 3, y: 4 }, rotation: 1, walkable: true },
  { id: 'sticker_achievements', ...CATALOG_ITEMS[5], gridPosition: { x: 1, y: 2 }, rotation: 1, walkable: true },
];
export const ACHIEVEMENTS = [
  { key: 'first_spray', icon: '🎨', title: 'Primeiro Risco', description: 'Fazer um graffiti na parede da sala.' },
  { key: 'dj', icon: '🎧', title: 'DJ do Quarto', description: 'Tocar uma batida na estação DAW.' },
  { key: 'hacker', icon: '💻', title: 'Hacker', description: 'Entrar com sucesso no Incident Manager e ativar o modo ROOT.' },
];
export const INSTRUMENTS = ['Kick', 'Snare', 'HiHat', 'OpenHat', 'Perc'];
export const createInitialDawState = () => ({
  isPlaying: false, currentStep: 0, bpm: 120, masterVolume: 0.8, isMuteAll: false,
  pattern: Array.from({ length: 5 }, () => Array(16).fill(false)),
  mutes: Array(5).fill(false), solos: Array(5).fill(false),
});
