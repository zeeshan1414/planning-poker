import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, RoomError, publicId } from '../src/rooms.js';

const ROOM = 'abcd2345';
const FAC = 'facilitator-token-0001';
const BOB = 'bob-token-00000000001';
const OBS = 'observer-token-000001';

function setup() {
  const rooms = new RoomManager();
  rooms.host(ROOM, FAC, { name: 'Sprint 42' });
  const fac = rooms.connect(ROOM, FAC, { name: 'Alice', role: 'voter' });
  const bob = rooms.connect(ROOM, BOB, { name: 'Bob', role: 'voter' });
  const obs = rooms.connect(ROOM, OBS, { name: 'Olive', role: 'observer' });
  return { rooms, fac, bob, obs };
}

test('host creates room with seeding facilitator; second host is ignored', () => {
  const rooms = new RoomManager();
  assert.equal(rooms.host(ROOM, FAC, { name: 'A' }).created, true);
  assert.equal(rooms.host(ROOM, BOB, { name: 'B' }).created, false);
  const room = rooms.rooms.get(ROOM);
  assert.equal(room.name, 'A');
  assert.equal(room.facilitatorId, publicId(ROOM, FAC));
});

test('votes are hidden from others until reveal', () => {
  const { rooms, fac, bob } = setup();
  rooms.vote(ROOM, bob, '5');

  const facView = rooms.snapshot(ROOM, fac);
  const bobInFacView = facView.participants.find((p) => p.id === bob);
  assert.equal(bobInFacView.hasVoted, true);
  assert.equal(bobInFacView.vote, null);
  assert.equal(rooms.snapshot(ROOM, bob).participants.find((p) => p.id === bob).vote, '5');

  rooms.reveal(ROOM, fac);
  const revealed = rooms.snapshot(ROOM, fac);
  assert.equal(revealed.participants.find((p) => p.id === bob).vote, '5');
  assert.equal(revealed.round.stats.average, 5);
});

test('only facilitator can reveal, reset, set story, next round', () => {
  const { rooms, bob } = setup();
  rooms.vote(ROOM, bob, '3');
  for (const fn of [
    () => rooms.reveal(ROOM, bob),
    () => rooms.resetVotes(ROOM, bob),
    () => rooms.setStory(ROOM, bob, 'x'),
    () => rooms.nextRound(ROOM, bob, 'x'),
  ]) {
    assert.throws(fn, RoomError);
  }
});

test('observers cannot vote; switching to observer drops pending vote', () => {
  const { rooms, bob, obs } = setup();
  assert.throws(() => rooms.vote(ROOM, obs, '3'), /Observers/);
  rooms.vote(ROOM, bob, '3');
  rooms.setRole(ROOM, bob, 'observer');
  assert.equal(rooms.snapshot(ROOM, bob).round.votedCount, 0);
});

test('invalid cards and voting after reveal are rejected', () => {
  const { rooms, fac, bob } = setup();
  assert.throws(() => rooms.vote(ROOM, bob, '4'), /Invalid card/);
  rooms.vote(ROOM, bob, '8');
  rooms.reveal(ROOM, fac);
  assert.throws(() => rooms.vote(ROOM, bob, '3'), /already revealed/);
});

test('reveal requires at least one vote', () => {
  const { rooms, fac } = setup();
  assert.throws(() => rooms.reveal(ROOM, fac), /No votes/);
});

test('reset clears votes and keeps story', () => {
  const { rooms, fac, bob } = setup();
  rooms.setStory(ROOM, fac, 'Login page');
  rooms.vote(ROOM, bob, '8');
  rooms.reveal(ROOM, fac);
  rooms.resetVotes(ROOM, fac);
  const s = rooms.snapshot(ROOM, fac);
  assert.equal(s.round.revealed, false);
  assert.equal(s.round.votedCount, 0);
  assert.equal(s.round.story, 'Login page');
  assert.equal(s.history.length, 0);
});

test('next round archives revealed round into history', () => {
  const { rooms, fac, bob } = setup();
  rooms.setStory(ROOM, fac, 'Login page');
  rooms.vote(ROOM, fac, '5');
  rooms.vote(ROOM, bob, '5');
  rooms.reveal(ROOM, fac);
  rooms.nextRound(ROOM, fac, 'Signup page');

  const s = rooms.snapshot(ROOM, fac);
  assert.equal(s.round.number, 2);
  assert.equal(s.round.story, 'Signup page');
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0].story, 'Login page');
  assert.equal(s.history[0].stats.consensus, true);
  assert.deepEqual(s.history[0].votes.map((v) => v.name).sort(), ['Alice', 'Bob']);
});

test('unrevealed rounds are not archived', () => {
  const { rooms, fac } = setup();
  rooms.nextRound(ROOM, fac, '');
  assert.equal(rooms.snapshot(ROOM, fac).history.length, 0);
});

test('facilitator transfer and claim', () => {
  const { rooms, fac, bob } = setup();
  assert.throws(() => rooms.claimFacilitator(ROOM, bob), /still online/);
  rooms.transferFacilitator(ROOM, fac, bob);
  assert.equal(rooms.snapshot(ROOM, bob).me.isFacilitator, true);

  rooms.disconnect(ROOM, bob);
  rooms.claimFacilitator(ROOM, fac);
  assert.equal(rooms.snapshot(ROOM, fac).me.isFacilitator, true);
});

test('offline participants are listed only while their vote counts', () => {
  const { rooms, fac, bob } = setup();
  rooms.vote(ROOM, bob, '3');
  rooms.disconnect(ROOM, bob);
  const p = rooms.snapshot(ROOM, fac).participants.find((x) => x.id === bob);
  assert.equal(p.online, false);
  rooms.resetVotes(ROOM, fac);
  assert.equal(rooms.snapshot(ROOM, fac).participants.some((x) => x.id === bob), false);
});

test('seed from browser storage is sanitized', () => {
  const rooms = new RoomManager();
  rooms.host(ROOM, FAC, {
    name: '  Team   room ',
    round: { number: 4, story: 'Story D' },
    history: [
      { number: 3, story: 'C', revealedAt: 1, votes: [{ name: 'A', value: '5' }, { name: 'B', value: 'bogus' }] },
      'garbage',
      { number: 2, story: 'x'.repeat(500), votes: [] },
    ],
  });
  const fac = rooms.connect(ROOM, FAC, { name: 'Alice', role: 'voter' });
  const s = rooms.snapshot(ROOM, fac);
  assert.equal(s.room.name, 'Team room');
  assert.equal(s.round.number, 4);
  assert.equal(s.round.story, 'Story D');
  assert.equal(s.history.length, 1);
  assert.deepEqual(s.history[0].votes, [{ name: 'A', value: '5' }]);
  assert.equal(s.history[0].stats.average, 5);
});

test('seed without a room name is rejected', () => {
  assert.throws(() => new RoomManager().host(ROOM, FAC, {}), /Room name is required/);
});

test('sweep removes rooms that have been empty past the TTL', () => {
  let t = 0;
  const rooms = new RoomManager({ now: () => t });
  rooms.host(ROOM, FAC, { name: 'A' });
  const fac = rooms.connect(ROOM, FAC, { name: 'Alice', role: 'voter' });
  t = 1000;
  assert.deepEqual(rooms.sweep(500), []);
  rooms.disconnect(ROOM, fac);
  t = 1400;
  assert.deepEqual(rooms.sweep(500), []);
  t = 1600;
  assert.deepEqual(rooms.sweep(500), [ROOM]);
});
