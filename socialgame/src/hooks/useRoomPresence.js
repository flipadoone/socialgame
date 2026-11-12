import { useEffect, useMemo, useRef, useState } from 'react';
import { acquireRoomSocket, isRoomServerConfigured } from '../services/roomSocket';
import { skinToPayload } from '../config/skins';

const FIELDS = ['name', 'isRoot', 'x', 'y', 'dir', 'isWalking', 'isSitting', 'skin'];

/**
 * Presença multiplayer: publica o avatar local (posição e skin) e mantém a lista dos outros
 * jogadores. `local` = { x, y, dir, isWalking, isSitting }.
 */
export function useRoomPresence({ local, skin }) {
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState('offline');
  const [myId, setMyId] = useState(null);
  const connRef = useRef(null);
  const localRef = useRef(local);
  const skinRef = useRef(skin);
  localRef.current = local;
  skinRef.current = skin;

  useEffect(() => {
    if (!isRoomServerConfigured()) return undefined;
    const conn = acquireRoomSocket();
    connRef.current = conn;

    const offs = [
      conn.onStatus(next => { setStatus(next); if (next !== 'connected') setPlayers({}); }),
      // O servidor responde ao "join" com "welcome": hora de informar onde estamos e como somos.
      conn.on('welcome', message => {
        setMyId(message.id);
        conn.send('presence', localRef.current);
        conn.send('skin', { skin: skinToPayload(skinRef.current) });
      }),
      conn.on('presence-snapshot', message => {
        setPlayers(Object.fromEntries((message.players || []).map(player => [player.id, player])));
      }),
      conn.on('presence-join', message => {
        if (message.player) setPlayers(previous => ({ ...previous, [message.player.id]: message.player }));
      }),
      conn.on('presence-update', message => {
        setPlayers(previous => {
          if (!previous[message.id]) return previous;
          const patch = {};
          FIELDS.forEach(field => { if (message[field] !== undefined) patch[field] = message[field]; });
          return { ...previous, [message.id]: { ...previous[message.id], ...patch } };
        });
      }),
      conn.on('presence-leave', message => {
        setPlayers(previous => {
          if (!previous[message.id]) return previous;
          const { [message.id]: _removed, ...rest } = previous;
          return rest;
        });
      }),
    ];

    return () => { offs.forEach(off => off()); conn.release(); connRef.current = null; setPlayers({}); setMyId(null); };
  }, []);

  // Publica cada mudança do avatar local.
  useEffect(() => {
    connRef.current?.send('presence', local);
  }, [local.x, local.y, local.dir, local.isWalking, local.isSitting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Publica a troca de skin.
  useEffect(() => {
    connRef.current?.send('skin', { skin: skinToPayload(skin) });
  }, [skin]);

  const others = useMemo(() => Object.values(players), [players]);
  return { others, status, myId };
}
