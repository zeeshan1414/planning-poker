import { useI18n } from '../lib/i18n.jsx';

export default function History({ history }) {
  const { t, lang } = useI18n();
  const dash = (v) => v ?? '–';

  return (
    <div className="panel">
      <h3>{t('history.title')}</h3>
      {history.length === 0 ? (
        <p className="muted">{t('history.empty')}</p>
      ) : (
        <ul className="history">
          {history.map((h, i) => (
            <li key={`${h.number}-${i}`}>
              <details>
                <summary>
                  <span className="muted">#{h.number}</span> {h.story || <em className="muted">{t('history.untitled')}</em>}
                  <span className="history-result">
                    {h.stats.consensus && '🎉 '}
                    {dash(h.stats.suggested)}
                  </span>
                </summary>
                <div className="history-detail">
                  <p className="muted">
                    {t('history.summary', { average: dash(h.stats.average), min: dash(h.stats.min), max: dash(h.stats.max) })}
                    {h.revealedAt && ` · ${new Date(h.revealedAt).toLocaleString(lang)}`}
                  </p>
                  <ul>
                    {h.votes.map((v, j) => (
                      <li key={j}>
                        {v.name}: <strong>{v.value}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
