import test from 'node:test';
import assert from 'node:assert/strict';
import { io as ioClient } from 'socket.io-client';
import { createServer } from '../src/index.js';

const ROOM = 'zxcv2345';
const FAC = 'facilitator-token-0001';
const BOB = 'bob-token-00000000001';

async function start() {
  const srv = createServer({ clientDist: '/nonexistent' });
  await new Promise((r) => srv.server.listen(0, r));
  const url = `http://localhost:${srv.server.address().port}`;
  const clients = [];

  function client() {
    const socket = ioClient(url, { transports: ['websocket'], forceNew: true });
    clients.push(socket);
    const states = [];
    socket.on('state', (s) => states.push(s));
    const emit = (event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));
    const nextState = (pred = () => true) =>
      new Promise((resolve) => {
        const check = (s) => pred(s) && (socket.off('state', check), resolve(s));
        socket.on('state', check);
      });
    return { socket, states, emit, nextState, latest: () => states.at(-1) };
  }

  const stop = async () => {
    clients.forEach((c) => c.close());
    await srv.close();
  };
  return { client, stop };
}

test('full round over sockets', async (t) => {
  const { client, stop } = await start();
  t.after(stop);

  const alice = client();
  assert.deepEqual(
    await alice.emit('join', { roomId: ROOM, token: FAC, name: 'Alice', seed: { name: 'Sprint' } }),
    { ok: true },
  );

  const bob = client();
  const bobJoined = alice.nextState((s) => s.participants.length === 2);
  assert.deepEqual(await bob.emit('join', { roomId: ROOM, token: BOB, name: 'Bob' }), { ok: true });
  await bobJoined;

  assert.deepEqual(await bob.emit('reveal'), { error: 'Only the facilitator can do that' });

  const voted = alice.nextState((s) => s.round.votedCount === 1);
  await bob.emit('vote', { value: '8' });
  const s1 = await voted;
  assert.equal(s1.participants.find((p) => p.name === 'Bob').vote, null, 'vote hidden before reveal');

  const revealed = bob.nextState((s) => s.round.revealed);
  assert.deepEqual(await alice.emit('reveal'), { ok: true });
  const s2 = await revealed;
  assert.equal(s2.round.stats.average, 8);
  assert.equal(s2.participants.find((p) => p.name === 'Bob').vote, '8');

  const next = bob.nextState((s) => s.round.number === 2);
  await alice.emit('nextRound', { story: 'Next' });
  const s3 = await next;
  assert.equal(s3.history.length, 1);
  assert.equal(s3.round.story, 'Next');
});

test('participants wait until the facilitator re-seeds the room', async (t) => {
  const { client, stop } = await start();
  t.after(stop);

  const bob = client();
  assert.deepEqual(await bob.emit('join', { roomId: ROOM, token: BOB, name: 'Bob' }), { waiting: true });

  const bobAdmitted = bob.nextState();
  const alice = client();
  await alice.emit('join', {
    roomId: ROOM,
    token: FAC,
    name: 'Alice',
    seed: { name: 'Restored', round: { number: 7, story: 'S' }, history: [] },
  });
  const s = await bobAdmitted;
  assert.equal(s.room.name, 'Restored');
  assert.equal(s.round.number, 7);
  assert.equal(s.me.name, 'Bob');
  assert.equal(s.me.isFacilitator, false);
});

test('join validation errors are returned to the client', async (t) => {
  const { client, stop } = await start();
  t.after(stop);
  const c = client();
  assert.deepEqual(await c.emit('join', { roomId: 'BAD', token: FAC, name: 'A' }), { error: 'Invalid room id' });
  assert.deepEqual(await c.emit('join', { roomId: ROOM, token: FAC, name: '' }), { error: 'Name is required' });
});
