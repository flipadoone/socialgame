import { useEffect, useMemo, useRef, useState } from 'react';
import { getDirection } from '../utils/isoMath.jsx';
import {
  findPath, getBestNeighborTile, getBlockedTiles, isAvatarNearObject,
} from '../utils/pathfinding.js';

/** Movimento do avatar, pathfinding e interação espacial com os móveis. */
export function useRoomMovement({
  roomObjects,
  setRoomObjects,
  isRootUser,
  placingItem,
  setPlacingItem,
  movingObjId,
  setMovingObjId,
  setSelectedObject,
  onObjectAction,
  addAuditLog,
  rows = 9,
  cols = 9,
}) {
  const onObjectActionRef = useRef(onObjectAction);
  onObjectActionRef.current = onObjectAction;
  const [avatarPos, setAvatarPos] = useState({ x: 1, y: 1 });
  const [avatarDir, setAvatarDir] = useState(4);
  const [currentPath, setCurrentPath] = useState([]);
  const [isWalking, setIsWalking] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [pendingInteraction, setPendingInteraction] = useState(null);
  const blockedTiles = useMemo(() => getBlockedTiles(roomObjects), [roomObjects]);

  useEffect(() => {
    if (currentPath.length === 0) {
      setIsWalking(false);
      return undefined;
    }
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
      onObjectActionRef.current(pendingInteraction);
      setPendingInteraction(null);
    }
  }, [currentPath, pendingInteraction]);

  function handleTileClick(x, y) {
    setPendingInteraction(null);

    if (placingItem && isRootUser) {
      if (placingItem.type === 'wall_decor' && x !== 0 && y !== 0) {
        alert('Objetos de parede devem ser colocados junto às paredes (X=0 ou Y=0).');
        return;
      }
      const object = {
        ...placingItem,
        id: `${placingItem.id}_${Date.now()}`,
        gridPosition: { x, y },
        rotation: 1,
        walkable: placingItem.type === 'sit' || placingItem.type === 'wall_decor' || placingItem.id === 'sticker',
      };
      setRoomObjects(previous => [...previous, object]);
      addAuditLog('FURNI', `Root adicionou item: ${object.name} em (${x}, ${y})`);
      setPlacingItem(null);
      return;
    }

    if (movingObjId && isRootUser) {
      const moving = roomObjects.find(object => object.id === movingObjId);
      if (moving?.type === 'wall_decor' && x !== 0 && y !== 0) {
        alert('Objetos de parede devem ficar em X=0 ou Y=0.');
        return;
      }
      setRoomObjects(previous => previous.map(object =>
        object.id === movingObjId ? { ...object, gridPosition: { x, y } } : object
      ));
      addAuditLog('FURNI', `Root moveu item ${moving?.name || movingObjId} para (${x}, ${y})`);
      setMovingObjId(null);
      return;
    }

    setIsSitting(false);
    setSelectedObject(null);
    const path = findPath(avatarPos, { x, y }, rows, cols, blockedTiles);
    if (path.length) {
      setCurrentPath(path);
      setIsWalking(true);
    }
  }

  function handleObjectClick(object) {
    if (!placingItem && !movingObjId && isRootUser) setSelectedObject(object);
  }

  function handleObjectDoubleClick(object) {
    if (placingItem || movingObjId) return;
    if (isAvatarNearObject(avatarPos, object)) {
      onObjectAction(object);
      return;
    }

    const target = object.actionType === 'SIT'
      ? object.gridPosition
      : getBestNeighborTile(avatarPos, object, rows, cols, blockedTiles);
    if (!target) return;

    const path = findPath(
      avatarPos,
      target,
      rows,
      cols,
      object.actionType === 'SIT' ? [] : blockedTiles
    );
    if (path.length) {
      setPendingInteraction(object);
      setCurrentPath(path);
      setIsWalking(true);
    } else {
      alert(`Não há caminho livre até "${object.name}".`);
    }
  }

  function sitAvatar(position) {
    setAvatarPos(position);
    setIsSitting(true);
  }

  return {
    avatarPos, avatarDir, isWalking, isSitting, setAvatarPos, setIsSitting, sitAvatar,
    blockedTiles, handleTileClick, handleObjectClick, handleObjectDoubleClick,
  };
}
