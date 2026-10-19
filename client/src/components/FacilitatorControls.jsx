import { useState } from 'react';

export default function FacilitatorControls({ round, participants, send }) {
  const [nextStory, setNextStory] = useState('');
  const voterCount = participants.filter((p) => p.role === 'voter').length;

  const next = async (e) => {
    e.preventDefault();
    if (await send('nextRound', { story: nextStory.trim() })) setNextStory('');
  };

  return (
    <div className="panel controls">
      <div className="row">
        <span className="muted">
          {round.votedCount} of {voterCount} voted
        </span>
        <button className="primary" disabled={round.revealed || round.votedCount === 0} onClick={() => send('reveal')}>
          Reveal votes
        </button>
        <button disabled={round.votedCount === 0 && !round.revealed} onClick={() => send('resetVotes')}>
          Reset votes
        </button>
      </div>
      <form className="row" onSubmit={next}>
        <input value={nextStory} onChange={(e) => setNextStory(e.target.value)} maxLength={200} placeholder="Next story title (optional)" />
        <button type="submit">Next round →</button>
      </form>
    </div>
  );
}
