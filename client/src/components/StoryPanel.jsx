import { useEffect, useState } from 'react';

export default function StoryPanel({ round, canEdit, send }) {
  const [draft, setDraft] = useState(round.story);

  useEffect(() => setDraft(round.story), [round.story, round.number]);

  const save = () => {
    const story = draft.trim();
    if (story !== round.story) send('setStory', { story });
  };

  return (
    <div className="panel story">
      <span className="round-label">Round {round.number}</span>
      {canEdit ? (
        <input
          className="story-input"
          value={draft}
          maxLength={200}
          placeholder="What are we estimating? (e.g. JIRA-123 Login with SSO)"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      ) : (
        <h2 className="story-title">{round.story || <span className="muted">No story title yet</span>}</h2>
      )}
    </div>
  );
}
