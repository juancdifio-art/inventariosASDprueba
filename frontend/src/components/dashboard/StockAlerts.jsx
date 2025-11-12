export default function StockAlerts({ alerts = [], thresholdLabel = 'Stock bajo' }) {
  return (
    <div className="card p-3 h-100 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2 text-secondary small">
          <i className="bi bi-exclamation-triangle" />
          <span>{thresholdLabel}</span>
        </div>
        <span className="badge bg-warning-subtle text-warning fw-semibold">{alerts.length}</span>
      </div>
      {alerts.length === 0 ? (
        <div className="text-secondary small">Sin alertas de stock.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr className="text-secondary small">
                <th>Producto</th>
                <th className="text-end">Stock</th>
                <th className="text-end">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id ?? alert.producto_id}>
                  <td>
                    <div className="fw-semibold">{alert.nombre ?? `#${alert.producto_id}`}</div>
                    <div className="text-secondary small">
                      #{alert.producto_id}
                      {alert.categoria_nombre ? ` • ${alert.categoria_nombre}` : ''}
                    </div>
                  </td>
                  <td className="text-end fw-semibold text-danger">{alert.stock_actual ?? '—'}</td>
                  <td className="text-end text-secondary">
                    {typeof alert.stock_minimo !== 'undefined' ? alert.stock_minimo : alert.minimo ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

