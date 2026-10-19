export default function Deck({ deck, me, participants, round, send, onBecomeVoter }) {
  if (me.role === 'observer') {
    return (
      <div className="panel deck-note">
        You're observing. <button className="link" onClick={onBecomeVoter}>Switch to voter</button>
      </div>
    );
  }

  const myVote = participants.find((p) => p.id === me.id)?.vote ?? null;

  return (
    <div className="deck" aria-label="Your card">
      {deck.map((card) => {
        const selected = card === myVote;
        return (
          <button
            key={card}
            className={`card ${selected ? 'selected' : ''}`}
            disabled={round.revealed}
            aria-pressed={selected}
            onClick={() => send('vote', { value: selected ? null : card })}
            title={card === '?' ? 'Not sure' : card === '☕' ? 'Need a break' : `${card} points`}
          >
            {card}
          </button>
        );
      })}
    </div>
  );
}
