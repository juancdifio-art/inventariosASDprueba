export default function StatsCards({ stats = [] }) {
  return (
    <div className="row g-3">
      {stats.map((stat) => (
        <div key={stat.id ?? stat.label} className="col-12 col-md-6 col-xl-3">
          <div className="card p-3 h-100 shadow-sm">
            <div className="d-flex align-items-center justify-content-between gap-2 text-secondary small">
              <div className="d-flex align-items-center gap-2">
                {stat.icon ? <i className={`bi ${stat.icon}`} /> : null}
                <span>{stat.label}</span>
              </div>
              {typeof stat.delta === 'number' && (
                <span className={stat.delta >= 0 ? 'text-success' : 'text-danger'}>
                  {stat.delta >= 0 ? '+' : ''}{stat.delta}%
                </span>
              )}
            </div>
            <div className="fw-bold" style={{ fontSize: 28 }}>
              {stat.value ?? '—'}
            </div>
            {stat.description ? (
              <div className="text-secondary small mt-2">{stat.description}</div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

