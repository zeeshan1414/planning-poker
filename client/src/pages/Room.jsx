import { useState } from 'react';
import { exportRoom, getName, getRole, saveName, saveRole } from '../lib/storage.js';
import { useRoom } from '../lib/useRoom.js';
import { useI18n, LanguageSwitcher } from '../lib/i18n.jsx';
import Table from '../components/Table.jsx';
import Deck from '../components/Deck.jsx';
import Stats from '../components/Stats.jsx';
import History from '../components/History.jsx';
import StoryPanel from '../components/StoryPanel.jsx';
import FacilitatorControls from '../components/FacilitatorControls.jsx';
import CopyLink from '../components/CopyLink.jsx';

function JoinForm({ roomId, onJoin, navigate }) {
  const { t } = useI18n();
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
        <div className="row spread">
          <h2>{t('join.title')} <span className="code">{roomId}</span></h2>
          <LanguageSwitcher />
        </div>
        <label>
          {t('join.yourName')}
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={observer} onChange={(e) => setObserver(e.target.checked)} />
          {t('join.asObserver')}
        </label>
        <div className="row">
          <button className="primary" type="submit" disabled={!name.trim()}>{t('join.submit')}</button>
          <button type="button" onClick={() => navigate('/')}>{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  );
}

function Message({ title, children, navigate }) {
  const { t } = useI18n();
  return (
    <div className="center">
      <div className="panel narrow">
        <div className="row spread">
          <h2>{title}</h2>
          <LanguageSwitcher />
        </div>
        {children}
        <button onClick={() => navigate('/')}>{t('common.backHome')}</button>
      </div>
    </div>
  );
}

export default function Room({ roomId, navigate }) {
  const { t, tError } = useI18n();
  const [profileReady, setProfileReady] = useState(() => Boolean(getName()));
  const { status, state, error, connected, send, toast } = useRoom(roomId, profileReady);

  if (!profileReady) return <JoinForm roomId={roomId} onJoin={() => setProfileReady(true)} navigate={navigate} />;

  if (status === 'error') {
    return (
      <Message title={t('room.error.title')} navigate={navigate}>
        <p className="error">{tError(error)}</p>
      </Message>
    );
  }

  if (status === 'waiting') {
    const [before, after] = t('room.waiting.body', { id: '\u0000' }).split('\u0000');
    return (
      <Message title={t('room.waiting.title')} navigate={navigate}>
        <p>
          {before}<span className="code">{roomId}</span>{after}
        </p>
        <p className="hint">{t('room.waiting.hint')}</p>
      </Message>
    );
  }

  if (!state?.me) return <div className="center muted">{t('room.connecting')}</div>;

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
          <LanguageSwitcher />
          <CopyLink />
          <span className={`dot ${connected ? 'on' : 'off'}`} title={connected ? t('room.connected') : t('room.reconnecting')} />
        </div>
      </header>

      {!facilitator.online && !me.isFacilitator && (
        <div className="banner">
          {facilitator.name ? t('room.facilitatorOfflineNamed', { name: facilitator.name }) : t('room.facilitatorOffline')}
          <button onClick={() => send('claimFacilitator')}>{t('room.becomeFacilitator')}</button>
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
            <h3>{t('room.you')}</h3>
            <p>
              <strong>{me.name}</strong> {me.isFacilitator && <span className="badge">{t('room.facilitator')}</span>}
            </p>
            <div className="segmented" role="radiogroup" aria-label={t('room.role')}>
              {['voter', 'observer'].map((r) => (
                <button key={r} role="radio" aria-checked={me.role === r} className={me.role === r ? 'active' : ''} onClick={() => me.role !== r && changeRole(r)}>
                  {t(`room.${r}`)}
                </button>
              ))}
            </div>
            {me.isFacilitator && (
              <p className="hint">
                {t('room.storageHint')}{' '}
                <button className="link" onClick={() => exportRoom(room.id)}>{t('room.exportJson')}</button>
              </p>
            )}
          </div>
          <History history={history} />
        </aside>
      </main>

      {toast && <div className="toast" role="alert">{tError(toast)}</div>}
    </div>
  );
}
