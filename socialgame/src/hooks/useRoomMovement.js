import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDirection } from '../utils/isoMath.jsx';
import {
  findPath, getBestNeighborTile, getBlockedSet, isAvatarNearObject,
} from '../utils/pathfinding.js';

/**
 * Movimento do avatar, pathfinding e interação espacial com os móveis.
 * Os handlers retornados são ESTÁVEIS (leem o estado mais recente por ref), para que os
 * componentes memoizados da sala não re-renderizem a cada passo do avatar.
 */
export function useRoomMovement({
  roomObjects, setRoomObjects, isRootUser, placingItem, setPlacingItem, movingObjId, setMovingObjId,
  setSelectedObject, onObjectAction, addAuditLog, notify = message => window.alert(message),
  rows = 9, cols = 9,
}) {
  const [avatarPos, setAvatarPos] = useState({ x: 1, y: 1 });
  const [avatarDir, setAvatarDir] = useState(4);
  const [currentPath, setCurrentPath] = useState([]);
  const [isWalking, setIsWalking] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [pendingInteraction, setPendingInteraction] = useState(null);
  const blocked = useMemo(() => getBlockedSet(roomObjects), [roomObjects]);

  const latest = useRef({});
  latest.current = {
    roomObjects, isRootUser, placingItem, movingObjId, avatarPos, blocked, rows, cols, onObjectAction, notify,
  };

  useEffect(() => {
    if (currentPath.length === 0) { setIsWalking(false); return undefined; }
    const timer = window.setTimeout(() => {
      const next = currentPath[0];
      setAvatarDir(getDirection(avatarPos, next));
      setAvatarPos(next);
      setCurrentPath(path => path.slice(1));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [currentPath, avatarPos]);

  useEffect(() => {
    if (currentPath.length === 0 && pendingInteraction) {
      latest.current.onObjectAction(pendingInteraction);
      setPendingInteraction(null);
    }
  }, [currentPath, pendingInteraction]);

  const handleTileClick = useCallback((x, y) => {
    const s = latest.current;
    setPendingInteraction(null);

    if (s.placingItem && s.isRootUser) {
      if (s.placingItem.type === 'wall_decor' && x !== 0 && y !== 0) {
        s.notify('Objetos de parede devem ser colocados junto às paredes (X=0 ou Y=0).');
        return;
      }
      const object = {
        ...s.placingItem,
        id: `${s.placingItem.id}_${Date.now()}`,
        gridPosition: { x, y },
        rotation: 1,
        walkable: s.placingItem.type === 'sit' || s.placingItem.type === 'wall_decor' || s.placingItem.id === 'sticker',
      };
      setRoomObjects(previous => [...previous, object]);
      addAuditLog('FURNI', `Root adicionou item: ${object.name} em (${x}, ${y})`);
      setPlacingItem(null);
      return;
    }

    if (s.movingObjId && s.isRootUser) {
      const moving = s.roomObjects.find(object => object.id === s.movingObjId);
      if (moving?.type === 'wall_decor' && x !== 0 && y !== 0) {
        s.notify('Objetos de parede devem ficar em X=0 ou Y=0.');
        return;
      }
      setRoomObjects(previous => previous.map(object =>
        object.id === s.movingObjId ? { ...object, gridPosition: { x, y } } : object));
      addAuditLog('FURNI', `Root moveu item ${moving?.name || s.movingObjId} para (${x}, ${y})`);
      setMovingObjId(null);
      return;
    }

    setIsSitting(false);
    setSelectedObject(null);
    const path = findPath(s.avatarPos, { x, y }, s.rows, s.cols, s.blocked);
    if (path.length) { setCurrentPath(path); setIsWalking(true); }
  }, [setRoomObjects, addAuditLog, setPlacingItem, setMovingObjId, setSelectedObject]);

  const handleObjectClick = useCallback(object => {
    const s = latest.current;
    if (s.placingItem || s.movingObjId) return;
    // O robô conversa com um clique (sem precisar andar até ele).
    if (object.actionType === 'TALKTOME') s.onObjectAction(object);
    if (s.isRootUser) setSelectedObject(object);
  }, [setSelectedObject]);

  const handleObjectDoubleClick = useCallback(object => {
    const s = latest.current;
    if (s.placingItem || s.movingObjId || object.actionType === 'TALKTOME') return;
    if (isAvatarNearObject(s.avatarPos, object)) { s.onObjectAction(object); return; }

    const sit = object.actionType === 'SIT';
    const target = sit ? object.gridPosition : getBestNeighborTile(s.avatarPos, object, s.rows, s.cols, s.blocked);
    if (!target) return;
    const path = findPath(s.avatarPos, target, s.rows, s.cols, sit ? new Set() : s.blocked);
    if (path.length) {
      setPendingInteraction(object);
      setCurrentPath(path);
      setIsWalking(true);
    } else {
      s.notify(`Não há caminho livre até "${object.name}".`);
    }
  }, []);

  return {
    avatarPos, avatarDir, isWalking, isSitting, setAvatarPos, setIsSitting,
    handleTileClick, handleObjectClick, handleObjectDoubleClick,
  };
}
