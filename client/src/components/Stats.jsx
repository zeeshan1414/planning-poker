import { useI18n } from '../lib/i18n.jsx';

export default function Stats({ stats }) {
  const { t } = useI18n();
  const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1);
  const cells = [
    ['stats.average', stats.average],
    ['stats.suggested', stats.suggested],
    ['stats.min', stats.min],
    ['stats.max', stats.max],
  ];

  return (
    <div className="panel stats">
      {stats.consensus && <div className="consensus">{t('stats.consensus')}</div>}
      <div className="stat-grid">
        {cells.map(([key, value]) => (
          <div key={key}>
            <span className="stat-value">{value ?? '–'}</span>
            <span className="muted">{t(key)}</span>
          </div>
        ))}
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
