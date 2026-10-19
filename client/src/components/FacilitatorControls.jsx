import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';

export default function FacilitatorControls({ round, participants, send }) {
  const { t } = useI18n();
  const [nextStory, setNextStory] = useState('');
  const voterCount = participants.filter((p) => p.role === 'voter').length;

  const next = async (e) => {
    e.preventDefault();
    if (await send('nextRound', { story: nextStory.trim() })) setNextStory('');
  };

  return (
    <div className="panel controls">
      <div className="row">
        <span className="muted">{t('controls.voted', { voted: round.votedCount, total: voterCount })}</span>
        <button className="primary" disabled={round.revealed || round.votedCount === 0} onClick={() => send('reveal')}>
          {t('controls.reveal')}
        </button>
        <button disabled={round.votedCount === 0 && !round.revealed} onClick={() => send('resetVotes')}>
          {t('controls.reset')}
        </button>
      </div>
      <form className="row" onSubmit={next}>
        <input value={nextStory} onChange={(e) => setNextStory(e.target.value)} maxLength={200} placeholder={t('controls.nextPlaceholder')} />
        <button type="submit">{t('controls.next')}</button>
      </form>
    </div>
  );
}
