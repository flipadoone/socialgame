export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const ROOM_ASSETS = { floor: '/assets/floor.png', wall: '/assets/wall.png' };

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
  { id: 'robot', name: 'Robô TalkToMe (IA)', sprite: '/assets/robot.png', type: 'talktome', tileWidth: 1, tileHeight: 2, renderHeight: 60, actionType: 'TALKTOME' },
  { id: 'pilastra', name: 'Pilastra (1x1)', sprite: '/assets/pilastra.png', type: 'decor', tileWidth: 1, tileHeight: 1, renderHeight: 90 },
];

// SALA PADRÃO: é o que todo visitante vê ao entrar, sem precisar adicionar móveis.
// Para mudar: edite a lista abaixo OU monte a sala como root (com o servidor ligado, o layout
// salvo em server/data/room-layouts.json passa a valer para todos).
const catalogItem = id => CATALOG_ITEMS.find(item => item.id === id);
const place = (objectId, catalogId, x, y, walkable = false) =>
  ({ ...catalogItem(catalogId), id: objectId, gridPosition: { x, y }, rotation: 1, walkable });

export const INITIAL_ROOM_OBJECTS = [
  place('spraycans_1', 'spraycans', 1, 5),
  place('pc_desk', 'desk', 3, 2),
  place('beat_studio', 'beat', 5, 2),
  place('chair_dev', 'chair', 3, 4, true),
  place('sticker_achievements', 'sticker', 1, 2, true),
  place('noticeboard_1', 'noticeboard', 7, 2),
  place('postit_welcome', 'postit', 0, 4, true),
  place('chair_gamer', 'chair2', 6, 5, true),
  place('robot_1', 'robot', 2, 6, true),
  place('armario_1', 'armario', 8, 0),
];
export const ACHIEVEMENTS = [
  { key: 'first_spray', icon: '🎨', title: 'Primeiro Risco', description: 'Fazer um graffiti na parede da sala.' },
  { key: 'dj', icon: '🎧', title: 'DJ do Quarto', description: 'Tocar uma batida na estação DAW.' },
  { key: 'robot', icon: '🤖', title: 'Papo com o Robô', description: 'Conversar com o assistente de IA (TalkToMe).' },
  { key: 'hacker', icon: '💻', title: 'Hacker', description: 'Entrar com sucesso no Incident Manager e ativar o modo ROOT.' },
];
export const INSTRUMENTS = ['Kick', 'Snare', 'HiHat', 'OpenHat', 'Perc'];
export const createInitialDawState = () => ({
  isPlaying: false, startedAt: null, bpm: 120, masterVolume: 0.8, isMuteAll: false,
  pattern: Array.from({ length: 5 }, () => Array(16).fill(false)),
  mutes: Array(5).fill(false), solos: Array(5).fill(false),
});
