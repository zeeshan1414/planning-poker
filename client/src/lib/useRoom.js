import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { deleteRoom, getName, getRole, getToken, loadRoom, saveRoom } from './storage.js';

// status: 'connecting' | 'waiting' (room not open on server yet) | 'ready' | 'error'
export function useRoom(roomId, enabled) {
  const [status, setStatus] = useState('connecting');
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const socket = io({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // Re-sent on every (re)connect; the seed lets the facilitator's browser restore the
    // room if the server restarted and lost its in-memory state.
    socket.on('connect', () => {
      setConnected(true);
      const payload = { roomId, token: getToken(), name: getName(), role: getRole(roomId), seed: loadRoom(roomId) ?? undefined };
      socket.emit('join', payload, (res) => {
        if (res?.error) {
          setError(res.error);
          setStatus('error');
        } else if (res?.waiting) {
          setStatus('waiting');
        }
      });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('state', (s) => {
      setState(s);
      setStatus('ready');
    });
    socket.on('fatal', (res) => {
      setError(res?.error ?? 'Unable to join room');
      setStatus('error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, enabled]);

  useEffect(() => {
    if (!state?.me) return;
    if (state.me.isFacilitator) {
      saveRoom({
        id: state.room.id,
        name: state.room.name,
        round: { number: state.round.number, story: state.round.story },
        history: state.history,
      });
    } else if (loadRoom(roomId)) {
      // Facilitation moved to someone else; their browser now owns the room data.
      deleteRoom(roomId);
    }
  }, [state, roomId]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const send = useCallback(
    (event, payload = {}) =>
      new Promise((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          setToast('Not connected to the server');
          resolve(false);
          return;
        }
        socket.emit(event, payload, (res) => {
          if (res?.error) setToast(res.error);
          resolve(!res?.error);
        });
      }),
    [],
  );

  return { status, state, error, connected, send, toast };
}
