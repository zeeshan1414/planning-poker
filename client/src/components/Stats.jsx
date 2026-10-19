export default function Stats({ stats }) {
  const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1);

  return (
    <div className="panel stats">
      {stats.consensus && <div className="consensus">🎉 Consensus!</div>}
      <div className="stat-grid">
        <div>
          <span className="stat-value">{stats.average ?? '–'}</span>
          <span className="muted">Average</span>
        </div>
        <div>
          <span className="stat-value">{stats.suggested ?? '–'}</span>
          <span className="muted">Suggested</span>
        </div>
        <div>
          <span className="stat-value">{stats.min ?? '–'}</span>
          <span className="muted">Min</span>
        </div>
        <div>
          <span className="stat-value">{stats.max ?? '–'}</span>
          <span className="muted">Max</span>
        </div>
      </div>
      <div className="distribution">
        {stats.distribution.map((d) => (
          <div key={d.value} className="bar-row">
            <span className="bar-label">{d.value}</span>
            <div className="bar" style={{ width: `${(d.count / maxCount) * 100}%` }} />
            <span className="muted">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
