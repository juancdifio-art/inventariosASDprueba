export default function RecentProducts({ products = [] }) {
  return (
    <div className="card p-3 h-100 shadow-sm">
      <div className="d-flex align-items-center gap-2 fw-semibold mb-2">
        <i className="bi bi-clock-history" />
        <span>Productos recientes</span>
      </div>
      {products.length === 0 ? (
        <div className="text-secondary small">Sin productos recientes.</div>
      ) : (
        <div className="d-grid gap-2">
          {products.map((item) => (
            <div key={item.id} className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-semibold">{item.nombre ?? `#${item.id}`}</div>
                <div className="text-secondary small">
                  #{item.id}
                  {' '}
                  {item.categoria_nombre ? `• ${item.categoria_nombre}` : ''}
                </div>
              </div>
              <div className="text-end text-secondary small">
                {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

