function Seat({ p, me, round, canTransfer, send }) {
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
        {p.isFacilitator && <span title="Facilitator">👑 </span>}
        {p.name}
        {isMe && <span className="muted"> (you)</span>}
      </div>
      {!p.online && <div className="muted tiny">offline</div>}
      {canTransfer && !isMe && p.online && (
        <button className="link tiny" onClick={() => window.confirm(`Make ${p.name} the facilitator?`) && send('transferFacilitator', { participantId: p.id })}>
          make facilitator
        </button>
      )}
    </div>
  );
}

export default function Table({ participants, me, round, send }) {
  const voters = participants.filter((p) => p.role === 'voter');
  const observers = participants.filter((p) => p.role === 'observer');

  return (
    <div className="panel">
      <div className="table">
        {voters.length === 0 && <p className="muted">No voters yet — share the invite link.</p>}
        {voters.map((p) => (
          <Seat key={p.id} p={p} me={me} round={round} canTransfer={me.isFacilitator} send={send} />
        ))}
      </div>
      {observers.length > 0 && (
        <div className="observers">
          <span className="muted">👀 Observers:</span>
          {observers.map((p) => (
            <span key={p.id} className="chip">
              {p.isFacilitator && '👑 '}
              {p.name}
              {p.id === me.id && ' (you)'}
              {me.isFacilitator && p.id !== me.id && (
                <button className="link tiny" onClick={() => window.confirm(`Make ${p.name} the facilitator?`) && send('transferFacilitator', { participantId: p.id })}>
                  make facilitator
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
