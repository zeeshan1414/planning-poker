import { useI18n } from '../lib/i18n.jsx';

export default function Deck({ deck, me, participants, round, send, onBecomeVoter }) {
  const { t } = useI18n();

  if (me.role === 'observer') {
    return (
      <div className="panel deck-note">
        {t('deck.observing')} <button className="link" onClick={onBecomeVoter}>{t('deck.switchToVoter')}</button>
      </div>
    );
  }

  const myVote = participants.find((p) => p.id === me.id)?.vote ?? null;
  const cardTitle = (card) => (card === '?' ? t('deck.unsure') : card === '☕' ? t('deck.break') : t('deck.points', { value: card }));

  return (
    <div className="deck" aria-label={t('deck.label')}>
      {deck.map((card) => {
        const selected = card === myVote;
        return (
          <button
            key={card}
            className={`card ${selected ? 'selected' : ''}`}
            disabled={round.revealed}
            aria-pressed={selected}
            onClick={() => send('vote', { value: selected ? null : card })}
            title={cardTitle(card)}
          >
            {card}
          </button>
        );
      })}
    </div>
  );
}
