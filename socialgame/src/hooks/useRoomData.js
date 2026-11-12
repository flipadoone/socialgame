import { useCallback, useEffect, useState } from 'react';
import { INITIAL_ROOM_OBJECTS } from '../config/roomConstants';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function currentTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** Estado persistente da sala: móveis, graffiti, auditoria e APIs cadastradas. */
export function useRoomData() {
  const [roomObjects, setRoomObjects] = useState(() =>
    readJSON('habbo_room_objects', INITIAL_ROOM_OBJECTS)
  );
  const [graffitiData, setGraffitiData] = useState(() =>
    localStorage.getItem('habbo_wall_graffiti')
  );
  const [auditLogs, setAuditLogs] = useState(() =>
    readJSON('habbo_audit_logs', [{
      id: 1, type: 'SYS', text: 'Sistema iniciado em ambiente seguro.', time: currentTime(),
    }])
  );
  const [apiProjects, setApiProjects] = useState(() => readJSON('habbo_dev_apis', [
    { id: '1', title: 'Incident Management System', desc: 'Sistema Fullstack de Gestão de Incidentes (Angular + Docker/Spring Boot)', endpoint: 'http://localhost:4200' },
    { id: '2', title: 'Habbo Studio - Engine Isométrica', desc: 'Interface Isométrica 2D com Pathfinding BFS (React + JS ES6+)', endpoint: 'http://localhost:5173' },
    { id: '3', title: 'Python Audio DAW Engine', desc: 'Estação de Trabalho de Áudio Digital em Python (Em Dev)', endpoint: 'http://localhost:8080/audio' },
  ]));

  useEffect(() => localStorage.setItem('habbo_room_objects', JSON.stringify(roomObjects)), [roomObjects]);
  useEffect(() => localStorage.setItem('habbo_dev_apis', JSON.stringify(apiProjects)), [apiProjects]);
  // A auditoria muda a cada ação; grava só quando o usuário "para" por meio segundo.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem('habbo_audit_logs', JSON.stringify(auditLogs)); } catch { /* cota cheia */ }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [auditLogs]);

  const addAuditLog = useCallback((type, message) => {
    const entry = { id: Date.now() + Math.random(), type, text: message, time: currentTime() };
    setAuditLogs(previous => [...previous, entry]);
  }, []);

  const saveGraffiti = useCallback((data) => {
    setGraffitiData(data);
    localStorage.setItem('habbo_wall_graffiti', data);
    addAuditLog('ART', 'Mural de Graffiti atualizado na parede direita.');
  }, [addAuditLog]);

  return {
    roomObjects, setRoomObjects,
    graffitiData, saveGraffiti,
    auditLogs, addAuditLog,
    apiProjects, setApiProjects,
  };
}
