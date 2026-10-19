// Everything persisted in the browser lives here.
// - Identity (secret token, display name, per-room role) is stored by every participant.
// - Room snapshots (name, current round, history) are stored only by the facilitator,
//   whose browser is the source of truth used to re-seed the room after a server restart.

const TOKEN_KEY = 'pp.token';
const NAME_KEY = 'pp.name';
const roleKey = (roomId) => `pp.role.${roomId}`;
const roomKey = (roomId) => `pp.room.${roomId}`;
const ROOM_PREFIX = 'pp.room.';

export const ROOM_ID_RE = /^[a-z0-9]{8}$/;
const ROOM_ID_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function randomHex(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function newRoomId() {
  // 32-char alphabet divides 256 evenly, so there's no modulo bias.
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => ROOM_ID_ALPHABET[b % 32]).join('');
}

export function getToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = randomHex(24);
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export const getName = () => localStorage.getItem(NAME_KEY) || '';
export const saveName = (name) => localStorage.setItem(NAME_KEY, name);

export const getRole = (roomId) => (localStorage.getItem(roleKey(roomId)) === 'observer' ? 'observer' : 'voter');
export const saveRole = (roomId, role) => localStorage.setItem(roleKey(roomId), role);

export const loadRoom = (roomId) => readJson(roomKey(roomId));

export function saveRoom(snapshot) {
  localStorage.setItem(roomKey(snapshot.id), JSON.stringify({ ...snapshot, savedAt: Date.now() }));
}

export const deleteRoom = (roomId) => localStorage.removeItem(roomKey(roomId));

export function listRooms() {
  const rooms = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(ROOM_PREFIX)) continue;
    const room = readJson(key);
    if (room?.id && room?.name) rooms.push(room);
  }
  return rooms.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
}

export function exportRoom(roomId) {
  const room = loadRoom(roomId);
  if (!room) return;
  const blob = new Blob([JSON.stringify(room, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `planning-poker-${roomId}.json` });
  a.click();
  URL.revokeObjectURL(url);
}
