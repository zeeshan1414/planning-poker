import crypto from 'node:crypto';
import { DECK, computeStats } from './stats.js';

export class RoomError extends Error {}

export const ROOM_ID_RE = /^[a-z0-9]{8}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;
const ROLES = new Set(['voter', 'observer']);
export const LIMITS = { roomName: 60, name: 40, story: 200, history: 100, historyVotes: 50 };

// Public participant ids are derived from the client's secret token so that ids can be
// shared with everyone in the room without letting anyone impersonate the facilitator.
export function publicId(roomId, token) {
  return crypto.createHash('sha256').update(`${roomId}:${token}`).digest('hex').slice(0, 16);
}

export function cleanText(value, max, field, { required = false } = {}) {
  if (value == null) value = '';
  if (typeof value !== 'string') throw new RoomError(`${field} must be text`);
  const v = value.trim().replace(/\s+/g, ' ');
  if (required && !v) throw new RoomError(`${field} is required`);
  if (v.length > max) throw new RoomError(`${field} must be at most ${max} characters`);
  return v;
}

export function assertRoomId(id) {
  if (typeof id !== 'string' || !ROOM_ID_RE.test(id)) throw new RoomError('Invalid room id');
}

export function assertToken(token) {
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) throw new RoomError('Invalid client token');
}

export function assertRole(role) {
  if (!ROLES.has(role)) throw new RoomError('Role must be voter or observer');
}

function sanitizeHistoryEntry(h) {
  if (!h || typeof h !== 'object' || Array.isArray(h)) return [];
  try {
    const votes = (Array.isArray(h?.votes) ? h.votes : [])
      .slice(0, LIMITS.historyVotes)
      .filter((v) => DECK.includes(v?.value))
      .map((v) => ({ name: cleanText(v.name, LIMITS.name, 'Name', { required: true }), value: v.value }));
    return [{
      number: Number.isInteger(h?.number) && h.number > 0 ? h.number : 0,
      story: cleanText(h?.story ?? '', LIMITS.story, 'Story'),
      revealedAt: Number.isFinite(h?.revealedAt) ? h.revealedAt : null,
      votes,
      stats: computeStats(votes.map((v) => v.value)),
    }];
  } catch {
    return [];
  }
}

// Seeds come from the facilitator's browser storage, so treat them as untrusted input.
export function sanitizeSeed(seed) {
  const n = seed?.round?.number;
  return {
    name: cleanText(seed?.name, LIMITS.roomName, 'Room name', { required: true }),
    number: Number.isInteger(n) && n > 0 ? n : 1,
    story: cleanText(seed?.round?.story ?? '', LIMITS.story, 'Story'),
    history: (Array.isArray(seed?.history) ? seed.history : [])
      .slice(0, LIMITS.history)
      .flatMap(sanitizeHistoryEntry),
  };
}

const newRound = (number, story = '') => ({ number, story, revealed: false, revealedAt: null, votes: new Map() });

export class RoomManager {
  constructor({ now = Date.now } = {}) {
    this.rooms = new Map();
    this.now = now;
  }

  has(roomId) {
    return this.rooms.has(roomId);
  }

  host(roomId, token, seed) {
    assertRoomId(roomId);
    assertToken(token);
    const existing = this.rooms.get(roomId);
    if (existing) return { room: existing, created: false };

    const s = sanitizeSeed(seed);
    const room = {
      id: roomId,
      name: s.name,
      facilitatorId: publicId(roomId, token),
      participants: new Map(),
      round: newRound(s.number, s.story),
      history: s.history,
      emptySince: this.now(),
    };
    this.rooms.set(roomId, room);
    return { room, created: true };
  }

  validateProfile({ name, role }) {
    const cleanName = cleanText(name, LIMITS.name, 'Name', { required: true });
    assertRole(role);
    return { name: cleanName, role };
  }

  connect(roomId, token, profile) {
    const room = this.#room(roomId);
    assertToken(token);
    const { name, role } = this.validateProfile(profile);
    const id = publicId(roomId, token);

    let p = room.participants.get(id);
    if (!p) {
      p = { id, joinedAt: this.now(), connections: 0 };
      room.participants.set(id, p);
    }
    p.name = name;
    this.#applyRole(room, p, role);
    p.connections += 1;
    room.emptySince = null;
    return id;
  }

  disconnect(roomId, pid) {
    const room = this.rooms.get(roomId);
    const p = room?.participants.get(pid);
    if (!p) return;
    p.connections = Math.max(0, p.connections - 1);
    this.#prune(room);
    if ([...room.participants.values()].every((x) => x.connections === 0)) room.emptySince = this.now();
  }

  // Removes rooms nobody has been connected to for longer than maxIdleMs.
  sweep(maxIdleMs) {
    const removed = [];
    for (const [id, room] of this.rooms) {
      if (room.emptySince != null && this.now() - room.emptySince > maxIdleMs) {
        this.rooms.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  setRole(roomId, pid, role) {
    assertRole(role);
    const room = this.#room(roomId);
    this.#applyRole(room, this.#participant(room, pid), role);
  }

  vote(roomId, pid, value) {
    const room = this.#room(roomId);
    const p = this.#participant(room, pid);
    if (p.role !== 'voter') throw new RoomError('Observers cannot vote');
    if (room.round.revealed) throw new RoomError('Votes are already revealed');
    if (value === null) {
      room.round.votes.delete(pid);
      return;
    }
    if (!DECK.includes(value)) throw new RoomError('Invalid card');
    room.round.votes.set(pid, value);
  }

  setStory(roomId, pid, story) {
    const room = this.#facilitatorRoom(roomId, pid);
    room.round.story = cleanText(story, LIMITS.story, 'Story');
  }

  reveal(roomId, pid) {
    const room = this.#facilitatorRoom(roomId, pid);
    if (room.round.revealed) return;
    if (room.round.votes.size === 0) throw new RoomError('No votes to reveal yet');
    room.round.revealed = true;
    room.round.revealedAt = this.now();
  }

  resetVotes(roomId, pid) {
    const room = this.#facilitatorRoom(roomId, pid);
    room.round = newRound(room.round.number, room.round.story);
    this.#prune(room);
  }

  nextRound(roomId, pid, story) {
    const room = this.#facilitatorRoom(roomId, pid);
    const nextStory = cleanText(story, LIMITS.story, 'Story');
    const { round } = room;
    if (round.revealed) {
      const votes = [...round.votes].map(([id, value]) => ({ name: room.participants.get(id)?.name ?? 'Unknown', value }));
      room.history.unshift({
        number: round.number,
        story: round.story,
        revealedAt: round.revealedAt,
        votes,
        stats: computeStats(votes.map((v) => v.value)),
      });
      room.history.length = Math.min(room.history.length, LIMITS.history);
    }
    room.round = newRound(round.number + 1, nextStory);
    this.#prune(room);
  }

  transferFacilitator(roomId, pid, targetId) {
    const room = this.#facilitatorRoom(roomId, pid);
    const target = room.participants.get(targetId);
    if (!target || target.connections === 0) throw new RoomError('That participant is not online');
    room.facilitatorId = target.id;
  }

  // Lets someone take over when the facilitator has left, so the room isn't stuck.
  claimFacilitator(roomId, pid) {
    const room = this.#room(roomId);
    this.#participant(room, pid);
    const current = room.participants.get(room.facilitatorId);
    if (current?.connections > 0) throw new RoomError('The facilitator is still online');
    room.facilitatorId = pid;
  }

  snapshot(roomId, viewerId) {
    const room = this.#room(roomId);
    const { round } = room;
    const participants = [...room.participants.values()]
      .filter((p) => p.connections > 0 || round.votes.has(p.id))
      .sort((a, b) => (a.role === b.role ? a.joinedAt - b.joinedAt : a.role === 'voter' ? -1 : 1))
      .map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        online: p.connections > 0,
        isFacilitator: p.id === room.facilitatorId,
        hasVoted: round.votes.has(p.id),
        vote: round.revealed || p.id === viewerId ? round.votes.get(p.id) ?? null : null,
      }));
    const me = room.participants.get(viewerId);
    const facilitator = room.participants.get(room.facilitatorId);

    return {
      room: { id: room.id, name: room.name, deck: DECK },
      me: me ? { id: me.id, name: me.name, role: me.role, isFacilitator: me.id === room.facilitatorId } : null,
      facilitator: { name: facilitator?.name ?? null, online: (facilitator?.connections ?? 0) > 0 },
      round: {
        number: round.number,
        story: round.story,
        revealed: round.revealed,
        revealedAt: round.revealedAt,
        votedCount: round.votes.size,
        stats: round.revealed ? computeStats([...round.votes.values()]) : null,
      },
      participants,
      history: room.history,
    };
  }

  #room(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new RoomError('Room not found');
    return room;
  }

  #participant(room, pid) {
    const p = room.participants.get(pid);
    if (!p) throw new RoomError('You are not in this room');
    return p;
  }

  #facilitatorRoom(roomId, pid) {
    const room = this.#room(roomId);
    if (room.facilitatorId !== pid) throw new RoomError('Only the facilitator can do that');
    return room;
  }

  #applyRole(room, p, role) {
    if (p.role === role) return;
    p.role = role;
    if (role === 'observer' && !room.round.revealed) room.round.votes.delete(p.id);
  }

  // Offline participants are kept only while their vote is part of the current round
  // (and the facilitator, so their name can still be shown).
  #prune(room) {
    for (const [id, p] of room.participants) {
      if (p.connections === 0 && !room.round.votes.has(id) && id !== room.facilitatorId) {
        room.participants.delete(id);
      }
    }
  }
}
