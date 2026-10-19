import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { RoomManager, RoomError, assertRoomId, assertToken } from './rooms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOUR = 60 * 60 * 1000;

function errorReply(err) {
  if (err instanceof RoomError) return { error: err.message };
  console.error(err);
  return { error: 'Internal server error' };
}

const replyFn = (ack) => (typeof ack === 'function' ? ack : () => {});

export function createServer({
  clientDist = path.resolve(__dirname, '../../client/dist'),
  roomTtlMs = 6 * HOUR,
  sweepIntervalMs = 5 * 60 * 1000,
  corsOrigin = process.env.CORS_ORIGIN,
} = {}) {
  const rooms = new RoomManager();
  const app = express();

  app.get('/healthz', (_req, res) => res.json({ ok: true, rooms: rooms.rooms.size }));

  const indexHtml = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => (req.method === 'GET' && req.accepts('html') ? res.sendFile(indexHtml) : next()));
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    maxHttpBufferSize: 256 * 1024,
    // Only needed when the client is served from a different origin (comma-separated list).
    cors: corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : undefined,
  });

  function broadcast(roomId) {
    const socketIds = io.sockets.adapter.rooms.get(roomId);
    if (!socketIds || !rooms.has(roomId)) return;
    for (const sid of socketIds) {
      const s = io.sockets.sockets.get(sid);
      if (s?.data.participantId) s.emit('state', rooms.snapshot(roomId, s.data.participantId));
    }
  }

  function attach(socket) {
    const { roomId, token, profile } = socket.data;
    socket.data.participantId = rooms.connect(roomId, token, profile);
  }

  // When the facilitator re-seeds a room, admit everyone who was waiting for it.
  function admitWaiting(roomId) {
    for (const sid of io.sockets.adapter.rooms.get(roomId) ?? []) {
      const s = io.sockets.sockets.get(sid);
      if (s && !s.data.participantId) {
        try {
          attach(s);
        } catch (err) {
          s.emit('fatal', errorReply(err));
        }
      }
    }
  }

  io.on('connection', (socket) => {
    socket.on('join', (payload, ack) => {
      const reply = replyFn(ack);
      try {
        if (socket.data.roomId) throw new RoomError('Already joined a room');
        const { roomId, token, name, role = 'voter', seed } = payload ?? {};
        assertRoomId(roomId);
        assertToken(token);
        const profile = rooms.validateProfile({ name, role });

        let created = false;
        if (!rooms.has(roomId) && seed) created = rooms.host(roomId, token, seed).created;

        socket.data = { roomId, token, profile };
        socket.join(roomId);

        if (!rooms.has(roomId)) {
          reply({ waiting: true });
          return;
        }
        attach(socket);
        if (created) admitWaiting(roomId);
        reply({ ok: true });
        broadcast(roomId);
      } catch (err) {
        reply(errorReply(err));
      }
    });

    const action = (fn) => (payload, ack) => {
      if (typeof payload === 'function') [ack, payload] = [payload, {}];
      const reply = replyFn(ack);
      try {
        const { roomId, participantId } = socket.data;
        if (!participantId) throw new RoomError('You have not joined a room');
        fn(roomId, participantId, payload ?? {});
        reply({ ok: true });
        broadcast(roomId);
      } catch (err) {
        reply(errorReply(err));
      }
    };

    socket.on('vote', action((r, p, { value }) => rooms.vote(r, p, value ?? null)));
    socket.on('setRole', action((r, p, { role }) => rooms.setRole(r, p, role)));
    socket.on('setStory', action((r, p, { story }) => rooms.setStory(r, p, story)));
    socket.on('reveal', action((r, p) => rooms.reveal(r, p)));
    socket.on('resetVotes', action((r, p) => rooms.resetVotes(r, p)));
    socket.on('nextRound', action((r, p, { story }) => rooms.nextRound(r, p, story)));
    socket.on('transferFacilitator', action((r, p, { participantId }) => rooms.transferFacilitator(r, p, participantId)));
    socket.on('claimFacilitator', action((r, p) => rooms.claimFacilitator(r, p)));

    socket.on('disconnect', () => {
      const { roomId, participantId } = socket.data;
      if (!participantId) return;
      rooms.disconnect(roomId, participantId);
      broadcast(roomId);
    });
  });

  const sweeper = setInterval(() => rooms.sweep(roomTtlMs), sweepIntervalMs);
  sweeper.unref();

  return {
    app,
    server,
    io,
    rooms,
    close: () =>
      new Promise((resolve) => {
        clearInterval(sweeper);
        io.close(() => resolve());
      }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3001;
  createServer().server.listen(port, () => console.log(`Planning Poker server listening on http://localhost:${port}`));
}
