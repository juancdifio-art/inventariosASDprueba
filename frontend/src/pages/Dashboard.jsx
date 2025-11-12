import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import StatsCards from '../components/dashboard/StatsCards.jsx';
import StockAlerts from '../components/dashboard/StockAlerts.jsx';
import RecentProducts from '../components/dashboard/RecentProducts.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const errorNotifiedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function load({ silent = false } = {}) {
      if (!mounted) return;
      if (!silent) {
        setError('');
        setLoading(true);
      }
      try {
        const response = await api.get('/dashboard/summary');
        if (!mounted) return;
        setData(response.data.data);
        setError('');
        errorNotifiedRef.current = false;
      } catch (e) {
        if (!mounted) return;
        const message = e?.response?.data?.message || 'Error al cargar el resumen';
        setError(message);
        if (!silent || !errorNotifiedRef.current) {
          addNotification({ variant: 'danger', message });
          errorNotifiedRef.current = true;
        }
      } finally {
        if (mounted && !silent) {
          setLoading(false);
        }
      }
    }

    load();
    const intervalId = setInterval(() => {
      load({ silent: true });
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [addNotification]);

  const stats = useMemo(() => {
    const totals = data?.totals ?? {};
    const lowStock = data?.lowStock ?? {};
    return [
      {
        id: 'productos-total',
        label: 'Productos',
        value: totals.productos ?? '—',
        icon: 'bi-box-seam',
        description: `${totals.productos_activos ?? '—'} activos`,
      },
      {
        id: 'categorias-total',
        label: 'Categorías',
        value: totals.categorias ?? '—',
        icon: 'bi-tags',
        description: `${totals.categorias_principales ?? '—'} principales`,
      },
      {
        id: 'proveedores-total',
        label: 'Proveedores',
        value: totals.proveedores ?? '—',
        icon: 'bi-truck',
        description: `${totals.proveedores_activos ?? '—'} activos`,
      },
      {
        id: 'movimientos-total',
        label: 'Movimientos (30 días)',
        value: totals.movimientos_30d ?? '—',
        icon: 'bi-activity',
      },
      {
        id: 'stock-bajo-total',
        label: 'Stock bajo',
        value: typeof lowStock.count === 'number' ? lowStock.count : '—',
        icon: 'bi-exclamation-triangle',
        description: lowStock.threshold ? `Umbral ≤ ${lowStock.threshold}` : null,
      },
    ];
  }, [data]);

  const stockAlerts = useMemo(() => data?.lowStock?.items ?? [], [data]);
  const lowStockLabel = useMemo(() => {
    const threshold = data?.lowStock?.threshold;
    return threshold ? `Stock bajo (≤ ${threshold})` : 'Stock bajo';
  }, [data]);

  const recentProducts = useMemo(() => data?.recentProducts ?? [], [data]);
  const recentMovements = useMemo(() => data?.recentMovements ?? [], [data]);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-0" style={{ fontSize: 28 }}>Dashboard</h2>
        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary">{user?.nombre}</span>
          <button className="btn btn-outline-dark btn-sm" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>
      <Breadcrumbs />

      {error && (
        <div style={{ color: 'white', background: '#ef4444', padding: 10, borderRadius: 6, marginTop: 16 }}>{error}</div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="mt-3 d-flex flex-column gap-3">
          <StatsCards stats={stats} />

          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <StockAlerts alerts={stockAlerts} thresholdLabel={lowStockLabel} />
            </div>
            <div className="col-12 col-lg-6">
              <RecentProducts products={recentProducts} />
            </div>
          </div>

          <div className="card p-3">
            <div className="fw-bold mb-2 d-flex align-items-center gap-2">
              <i className="bi bi-activity" />
              <span>Últimos movimientos</span>
            </div>
            <div className="d-grid gap-2">
              {recentMovements.map((m) => (
                <div key={m.id} className="d-flex justify-content-between" style={{ fontSize: 14 }}>
                  <span>
                    #{m.id} • {m.tipo}
                    {m.producto_id ? ` • prod ${m.producto_id}` : ''}
                  </span>
                  <span>
                    {typeof m.cantidad !== 'undefined' ? Number(m.cantidad) : '—'} •
                    {' '}
                    {m.created_at ? new Date(m.created_at).toLocaleString() : '—'}
                  </span>
                </div>
              ))}
              {recentMovements.length === 0 && (
                <div className="text-secondary">Sin movimientos recientes.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
