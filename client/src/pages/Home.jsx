import { useState } from 'react';
import {
  ROOM_ID_RE,
  deleteRoom,
  exportRoom,
  getName,
  listRooms,
  newRoomId,
  saveName,
  saveRoom,
} from '../lib/storage.js';

function parseRoomInput(input) {
  const v = input.trim();
  const m = v.match(/\/room\/([a-z0-9]{8})\b/);
  if (m) return m[1];
  return ROOM_ID_RE.test(v.toLowerCase()) ? v.toLowerCase() : null;
}

export default function Home({ navigate }) {
  const [roomName, setRoomName] = useState('');
  const [name, setName] = useState(getName());
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [rooms, setRooms] = useState(listRooms);

  const create = (e) => {
    e.preventDefault();
    const id = newRoomId();
    saveName(name.trim());
    saveRoom({ id, name: roomName.trim(), round: { number: 1, story: '' }, history: [] });
    navigate(`/room/${id}`);
  };

  const join = (e) => {
    e.preventDefault();
    const id = parseRoomInput(joinInput);
    if (!id) {
      setJoinError('Enter an 8-character room code or a room link');
      return;
    }
    navigate(`/room/${id}`);
  };

  const forget = (id) => {
    if (!window.confirm('Forget this room? Its round history in this browser will be deleted.')) return;
    deleteRoom(id);
    setRooms(listRooms());
  };

  return (
    <div className="home">
      <header className="hero">
        <h1>🃏 Planning Poker</h1>
        <p className="muted">Estimate stories together with Fibonacci cards. Votes stay hidden until the facilitator reveals them.</p>
      </header>

      <div className="home-grid">
        <form className="panel" onSubmit={create}>
          <h2>Create a room</h2>
          <label>
            Room name
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} maxLength={60} placeholder="Sprint 42 refinement" required />
          </label>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Alice" required />
          </label>
          <button className="primary" type="submit" disabled={!roomName.trim() || !name.trim()}>
            Create &amp; facilitate
          </button>
          <p className="hint">The room and its history are saved in this browser. Keep this tab (or browser) to restore it.</p>
        </form>

        <form className="panel" onSubmit={join}>
          <h2>Join a room</h2>
          <label>
            Room code or link
            <input value={joinInput} onChange={(e) => { setJoinInput(e.target.value); setJoinError(''); }} placeholder="abcd2345" required />
          </label>
          {joinError && <p className="error">{joinError}</p>}
          <button type="submit">Join</button>
        </form>
      </div>

      {rooms.length > 0 && (
        <section className="panel">
          <h2>Rooms you host</h2>
          <ul className="room-list">
            {rooms.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>{r.name}</strong>
                  <span className="muted"> · {r.id} · round {r.round?.number ?? 1} · {r.history?.length ?? 0} estimated</span>
                </div>
                <div className="row">
                  <button onClick={() => navigate(`/room/${r.id}`)}>Open</button>
                  <button onClick={() => exportRoom(r.id)}>Export</button>
                  <button className="danger" onClick={() => forget(r.id)}>Forget</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
