export type GridPoint = { x: number; y: number };
export type ObjectType = 'decor' | 'desk' | 'beat' | 'sit' | 'wall_decor';
export type ActionType = 'GRAFFITI' | 'POSTIT' | 'BEAT' | 'ACHIEVEMENTS' | 'SIT' | 'MODAL';

export interface CatalogItem {
  id: string; name: string; sprite: string; type: ObjectType;
  tileWidth: number; tileHeight: number; renderHeight: number;
  offsetY?: number; apiKey?: string; actionType?: ActionType;
}
export interface RoomObject extends CatalogItem {
  gridPosition: GridPoint; rotation: number; walkable: boolean;
}
export interface DawState {
  isPlaying: boolean; currentStep: number; bpm: number; masterVolume: number;
  isMuteAll: boolean; pattern: boolean[][]; mutes: boolean[]; solos: boolean[];
}
export interface AuditLog { id: number; type: string; text: string; time: string }
export interface Achievement { key: string; icon: string; title: string; description: string }
export interface ChatMessage { id: number; user: string; text: string; time: string }
