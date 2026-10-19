import { useState } from 'react';
import { useI18n, LanguageSwitcher } from '../lib/i18n.jsx';
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
  const { t } = useI18n();
  const [roomName, setRoomName] = useState('');
  const [name, setName] = useState(getName());
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState(false);
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
      setJoinError(true);
      return;
    }
    navigate(`/room/${id}`);
  };

  const forget = (id) => {
    if (!window.confirm(t('home.hosted.forgetConfirm'))) return;
    deleteRoom(id);
    setRooms(listRooms());
  };

  return (
    <div className="home">
      <header className="hero">
        <div className="hero-top">
          <h1>🃏 {t('app.title')}</h1>
          <LanguageSwitcher />
        </div>
        <p className="muted">{t('app.tagline')}</p>
      </header>

      <div className="home-grid">
        <form className="panel" onSubmit={create}>
          <h2>{t('home.create.title')}</h2>
          <label>
            {t('home.create.roomName')}
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} maxLength={60} placeholder={t('home.create.roomNamePlaceholder')} required />
          </label>
          <label>
            {t('home.create.yourName')}
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t('home.create.yourNamePlaceholder')} required />
          </label>
          <button className="primary" type="submit" disabled={!roomName.trim() || !name.trim()}>
            {t('home.create.submit')}
          </button>
          <p className="hint">{t('home.create.hint')}</p>
        </form>

        <form className="panel" onSubmit={join}>
          <h2>{t('home.join.title')}</h2>
          <label>
            {t('home.join.input')}
            <input value={joinInput} onChange={(e) => { setJoinInput(e.target.value); setJoinError(false); }} placeholder="abcd2345" required />
          </label>
          {joinError && <p className="error">{t('home.join.invalid')}</p>}
          <button type="submit">{t('home.join.submit')}</button>
        </form>
      </div>

      {rooms.length > 0 && (
        <section className="panel">
          <h2>{t('home.hosted.title')}</h2>
          <ul className="room-list">
            {rooms.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>{r.name}</strong>
                  <span className="muted"> · {r.id} · {t('home.hosted.meta', { round: r.round?.number ?? 1, count: r.history?.length ?? 0 })}</span>
                </div>
                <div className="row">
                  <button onClick={() => navigate(`/room/${r.id}`)}>{t('home.hosted.open')}</button>
                  <button onClick={() => exportRoom(r.id)}>{t('home.hosted.export')}</button>
                  <button className="danger" onClick={() => forget(r.id)}>{t('home.hosted.forget')}</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
