import { useState } from 'react';
import { exportRoom, getName, getRole, saveName, saveRole } from '../lib/storage.js';
import { useRoom } from '../lib/useRoom.js';
import Table from '../components/Table.jsx';
import Deck from '../components/Deck.jsx';
import Stats from '../components/Stats.jsx';
import History from '../components/History.jsx';
import StoryPanel from '../components/StoryPanel.jsx';
import FacilitatorControls from '../components/FacilitatorControls.jsx';
import CopyLink from '../components/CopyLink.jsx';

function JoinForm({ roomId, onJoin, navigate }) {
  const [name, setName] = useState(getName());
  const [observer, setObserver] = useState(getRole(roomId) === 'observer');

  const submit = (e) => {
    e.preventDefault();
    saveName(name.trim());
    saveRole(roomId, observer ? 'observer' : 'voter');
    onJoin();
  };

  return (
    <div className="center">
      <form className="panel narrow" onSubmit={submit}>
        <h2>Join room <span className="code">{roomId}</span></h2>
        <label>
          Your name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={observer} onChange={(e) => setObserver(e.target.checked)} />
          Join as observer (watch without voting)
        </label>
        <div className="row">
          <button className="primary" type="submit" disabled={!name.trim()}>Join</button>
          <button type="button" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Message({ title, children, navigate }) {
  return (
    <div className="center">
      <div className="panel narrow">
        <h2>{title}</h2>
        {children}
        <button onClick={() => navigate('/')}>Back home</button>
      </div>
    </div>
  );
}

export default function Room({ roomId, navigate }) {
  const [profileReady, setProfileReady] = useState(() => Boolean(getName()));
  const { status, state, error, connected, send, toast } = useRoom(roomId, profileReady);

  if (!profileReady) return <JoinForm roomId={roomId} onJoin={() => setProfileReady(true)} navigate={navigate} />;

  if (status === 'error') {
    return (
      <Message title="Couldn't join room" navigate={navigate}>
        <p className="error">{error}</p>
      </Message>
    );
  }

  if (status === 'waiting') {
    return (
      <Message title="Waiting for the facilitator…" navigate={navigate}>
        <p>
          Room <span className="code">{roomId}</span> isn't open right now. You'll join automatically as soon as the
          facilitator opens it in their browser.
        </p>
        <p className="hint">If this link is wrong, double-check the room code.</p>
      </Message>
    );
  }

  if (!state?.me) return <div className="center muted">Connecting…</div>;

  const { room, me, round, participants, history, facilitator } = state;
  const changeRole = (role) => {
    saveRole(roomId, role);
    send('setRole', { role });
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')}>🃏</button>
        <div className="room-title">
          <h1>{room.name}</h1>
          <span className="code">{room.id}</span>
        </div>
        <div className="row">
          <CopyLink />
          <span className={`dot ${connected ? 'on' : 'off'}`} title={connected ? 'Connected' : 'Reconnecting…'} />
        </div>
      </header>

      {!facilitator.online && !me.isFacilitator && (
        <div className="banner">
          {facilitator.name ? `${facilitator.name} (facilitator) is offline.` : 'The facilitator is offline.'}
          <button onClick={() => send('claimFacilitator')}>Become facilitator</button>
        </div>
      )}

      <main className="layout">
        <section className="main">
          <StoryPanel round={round} canEdit={me.isFacilitator} send={send} />
          <Table participants={participants} me={me} round={round} send={send} />
          {me.isFacilitator && <FacilitatorControls round={round} participants={participants} send={send} />}
          {round.revealed && round.stats && <Stats stats={round.stats} />}
          <Deck deck={room.deck} me={me} participants={participants} round={round} send={send} onBecomeVoter={() => changeRole('voter')} />
        </section>

        <aside className="side">
          <div className="panel">
            <h3>You</h3>
            <p>
              <strong>{me.name}</strong> {me.isFacilitator && <span className="badge">facilitator</span>}
            </p>
            <div className="segmented" role="radiogroup" aria-label="Role">
              {['voter', 'observer'].map((r) => (
                <button key={r} role="radio" aria-checked={me.role === r} className={me.role === r ? 'active' : ''} onClick={() => me.role !== r && changeRole(r)}>
                  {r === 'voter' ? 'Voter' : 'Observer'}
                </button>
              ))}
            </div>
            {me.isFacilitator && (
              <p className="hint">
                This room's history is saved in your browser and restores the room if the server restarts.{' '}
                <button className="link" onClick={() => exportRoom(room.id)}>Export JSON</button>
              </p>
            )}
          </div>
          <History history={history} />
        </aside>
      </main>

      {toast && <div className="toast" role="alert">{toast}</div>}
    </div>
  );
}
