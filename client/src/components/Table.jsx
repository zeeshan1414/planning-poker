import { useI18n } from '../lib/i18n.jsx';

function MakeFacilitator({ p, send }) {
  const { t } = useI18n();
  return (
    <button
      className="link tiny"
      onClick={() => window.confirm(t('table.makeFacilitatorConfirm', { name: p.name })) && send('transferFacilitator', { participantId: p.id })}
    >
      {t('table.makeFacilitator')}
    </button>
  );
}

function Seat({ p, me, round, canTransfer, send }) {
  const { t } = useI18n();
  const isMe = p.id === me.id;
  let cardClass = 'card small empty';
  let label = '';
  if (round.revealed && p.vote) {
    cardClass = 'card small face';
    label = p.vote;
  } else if (p.hasVoted) {
    cardClass = isMe ? 'card small face mine' : 'card small back';
    label = isMe ? p.vote : '';
  }

  return (
    <div className={`seat ${p.online ? '' : 'offline'}`}>
      <div className={cardClass}>{label}</div>
      <div className="seat-name" title={p.name}>
        {p.isFacilitator && <span title={t('table.facilitator')}>👑 </span>}
        {p.name}
        {isMe && <span className="muted"> {t('common.you')}</span>}
      </div>
      {!p.online && <div className="muted tiny">{t('table.offline')}</div>}
      {canTransfer && !isMe && p.online && <MakeFacilitator p={p} send={send} />}
    </div>
  );
}

export default function Table({ participants, me, round, send }) {
  const { t } = useI18n();
  const voters = participants.filter((p) => p.role === 'voter');
  const observers = participants.filter((p) => p.role === 'observer');

  return (
    <div className="panel">
      <div className="table">
        {voters.length === 0 && <p className="muted">{t('table.noVoters')}</p>}
        {voters.map((p) => (
          <Seat key={p.id} p={p} me={me} round={round} canTransfer={me.isFacilitator} send={send} />
        ))}
      </div>
      {observers.length > 0 && (
        <div className="observers">
          <span className="muted">{t('table.observers')}</span>
          {observers.map((p) => (
            <span key={p.id} className="chip">
              {p.isFacilitator && '👑 '}
              {p.name}
              {p.id === me.id && ` ${t('common.you')}`}
              {me.isFacilitator && p.id !== me.id && <MakeFacilitator p={p} send={send} />}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
