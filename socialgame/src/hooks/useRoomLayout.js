import { useEffect, useRef } from 'react';
import { INITIAL_ROOM_OBJECTS } from '../config/roomConstants';
import { acquireRoomSocket, isRoomServerConfigured } from '../services/roomSocket';

/**
 * Sala compartilhada: o servidor guarda o layout (persistido em disco) e envia a todos que entram.
 * - Visitante: recebe o layout do servidor (ou a sala padrão, se ainda não há layout salvo).
 * - Root: suas alterações são publicadas e passam a ser a sala de todos.
 */
export function useRoomLayout({ roomObjects, setRoomObjects, canEdit }) {
  const connRef = useRef(null);
  const canEditRef = useRef(canEdit);
  const objectsRef = useRef(roomObjects);
  canEditRef.current = canEdit;
  objectsRef.current = roomObjects;
  // Último layout que o servidor e este cliente concordam; evita eco e laços de publicação.
  const lastSyncedRef = useRef(JSON.stringify(roomObjects));

  useEffect(() => {
    if (!isRoomServerConfigured()) return undefined;
    const conn = acquireRoomSocket();
    connRef.current = conn;

    const off = conn.on('room-layout', message => {
      if (Array.isArray(message.objects)) {
        lastSyncedRef.current = JSON.stringify(message.objects);
        setRoomObjects(message.objects);
      } else if (canEditRef.current) {
        // Servidor ainda não tem sala salva: o root semeia com a que está vendo.
        lastSyncedRef.current = JSON.stringify(objectsRef.current);
        conn.send('room-layout', { objects: objectsRef.current });
      } else {
        lastSyncedRef.current = JSON.stringify(INITIAL_ROOM_OBJECTS);
        setRoomObjects(INITIAL_ROOM_OBJECTS);
      }
    });
    return () => { off(); conn.release(); connRef.current = null; };
  }, [setRoomObjects]);

  useEffect(() => {
    const serialized = JSON.stringify(roomObjects);
    if (serialized === lastSyncedRef.current) return;
    lastSyncedRef.current = serialized;
    if (canEdit) connRef.current?.send('room-layout', { objects: roomObjects });
  }, [roomObjects, canEdit]);
}
