import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';

export default function StoryPanel({ round, canEdit, send }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(round.story);

  useEffect(() => setDraft(round.story), [round.story, round.number]);

  const save = () => {
    const story = draft.trim();
    if (story !== round.story) send('setStory', { story });
  };

  return (
    <div className="panel story">
      <span className="round-label">{t('story.round', { number: round.number })}</span>
      {canEdit ? (
        <input
          className="story-input"
          value={draft}
          maxLength={200}
          placeholder={t('story.placeholder')}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && e.currentTarget.blur()}
        />
      ) : (
        <h2 className="story-title">{round.story || <span className="muted">{t('story.empty')}</span>}</h2>
      )}
    </div>
  );
}
