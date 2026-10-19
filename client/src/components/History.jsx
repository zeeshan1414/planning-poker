export default function History({ history }) {
  return (
    <div className="panel">
      <h3>History</h3>
      {history.length === 0 ? (
        <p className="muted">Revealed rounds will appear here after you move to the next round.</p>
      ) : (
        <ul className="history">
          {history.map((h, i) => (
            <li key={`${h.number}-${i}`}>
              <details>
                <summary>
                  <span className="muted">#{h.number}</span> {h.story || <em className="muted">Untitled</em>}
                  <span className="history-result">
                    {h.stats.consensus && '🎉 '}
                    {h.stats.suggested ?? '–'}
                  </span>
                </summary>
                <div className="history-detail">
                  <p className="muted">
                    avg {h.stats.average ?? '–'} · min {h.stats.min ?? '–'} · max {h.stats.max ?? '–'}
                    {h.revealedAt && ` · ${new Date(h.revealedAt).toLocaleString()}`}
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
