import { WebSocketServer } from 'ws';

const port = Number(process.env.ROOM_BEAT_PORT || 8787);
const server = new WebSocketServer({ port });
const rooms = new Map();
const memberships = new Map();
const latestState = new Map();

server.on('connection', socket => {
  socket.on('message', raw => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    const roomId = String(message.roomId || 'habbo-main-room').slice(0, 100);
    if (message.type === 'join') {
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket);
      memberships.set(socket, roomId);
      if (latestState.has(roomId)) socket.send(JSON.stringify({ type: 'beat-state', state: latestState.get(roomId) }));
      return;
    }
    if (message.type === 'beat-state' && memberships.get(socket) === roomId && message.state) {
      const state = message.state;
      // Aceita apenas os campos necessários; não permite payloads arbitrários grandes.
      const safeState = {
        isPlaying: Boolean(state.isPlaying), currentStep: Number(state.currentStep) || 0,
        startedAt: Number(state.startedAt) || Date.now(), bpm: Math.max(50, Math.min(200, Number(state.bpm) || 120)),
        masterVolume: Math.max(0, Math.min(1, Number(state.masterVolume) || 0)),
        isMuteAll: Boolean(state.isMuteAll),
        pattern: Array.isArray(state.pattern) ? state.pattern.slice(0, 5).map(row => Array.isArray(row) ? row.slice(0, 16).map(Boolean) : []) : [],
        mutes: Array.isArray(state.mutes) ? state.mutes.slice(0, 5).map(Boolean) : [],
        solos: Array.isArray(state.solos) ? state.solos.slice(0, 5).map(Boolean) : [],
      };
      latestState.set(roomId, safeState);
      const packet = JSON.stringify({ type: 'beat-state', state: safeState });
      for (const peer of rooms.get(roomId) || []) if (peer !== socket && peer.readyState === 1) peer.send(packet);
    }
  });
  socket.on('close', () => {
    const roomId = memberships.get(socket);
    if (roomId) { rooms.get(roomId)?.delete(socket); if (!rooms.get(roomId)?.size) rooms.delete(roomId); }
    memberships.delete(socket);
  });
});

console.log(`Room Beat WebSocket ativo na porta ${port}`);
