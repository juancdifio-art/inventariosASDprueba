import { useEffect, useMemo, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Alert from '../components/ui/Alert.jsx';
import SearchBar from '../components/base/SearchBar.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import {
  useAlertasList,
  useAlertasStats,
  useMarkAlertAsRead,
  useResolveAlert,
  useDeleteAlerta,
} from '../hooks/useAlertas.js';
import { runStockAlertsManually } from '../services/alertaService.js';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/formatters.js';

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'stock_minimo', label: 'Stock mínimo' },
  { value: 'sin_movimiento', label: 'Sin movimiento' },
  { value: 'vencimiento', label: 'Vencimiento' },
  { value: 'stock_critico', label: 'Stock crítico' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'activa', label: 'Activa' },
  { value: 'leida', label: 'Leída' },
  { value: 'resuelta', label: 'Resuelta' },
  { value: 'ignorada', label: 'Ignorada' },
];

const PRIORIDAD_OPTIONS = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

export default function Alertas() {
  const { addNotification } = useNotifications();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [search, setSearch] = useState('');
  const [isRunningManual, setIsRunningManual] = useState(false);

  const { data, isLoading, isFetching, refetch } = useAlertasList({ page, limit, tipo, estado, prioridad, search });
  const { data: stats, refetch: refetchStats } = useAlertasStats({ tipo, estado, prioridad });

  const markAsRead = useMarkAlertAsRead();
  const resolveAlert = useResolveAlert();
  const deleteAlert = useDeleteAlerta();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      refetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch, refetchStats]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const resumen = stats?.breakdown ?? [];
  const resumenTotales = useMemo(() => stats?.totals ?? [], [stats]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead.mutateAsync(id);
      addNotification({ variant: 'info', message: 'Alerta marcada como leída' });
    } catch (error) {
      const message = error?.response?.data?.message || 'No se pudo marcar como leída';
      addNotification({ variant: 'danger', message });
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlert.mutateAsync(id);
      addNotification({ variant: 'success', message: 'Alerta resuelta' });
    } catch (error) {
      const message = error?.response?.data?.message || 'No se pudo resolver la alerta';
      addNotification({ variant: 'danger', message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert.mutateAsync(id);
      addNotification({ variant: 'success', message: 'Alerta eliminada' });
    } catch (error) {
      const message = error?.response?.data?.message || 'No se pudo eliminar la alerta';
      addNotification({ variant: 'danger', message });
    }
  };

  const handleRunManual = async () => {
    try {
      setIsRunningManual(true);
      await runStockAlertsManually();
      addNotification({ variant: 'success', message: 'Alertas generadas automáticamente' });
      await Promise.all([refetch(), refetchStats()]);
    } catch (error) {
      const message = error?.response?.data?.message || 'No se pudo procesar alertas';
      addNotification({ variant: 'danger', message });
    } finally {
      setIsRunningManual(false);
    }
  };

  return (
    <div className="container">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h3 className="mb-0">Alertas</h3>
        <Button
          type="button"
          variant="outline-primary"
          onClick={handleRunManual}
          isLoading={isRunningManual}
          disabled={isRunningManual}
        >
          <i className="bi bi-arrow-repeat me-1" /> Generar alertas ahora
        </Button>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        <div className="row g-2 align-items-center mb-3">
          <div className="col-12 col-md-4">
            <SearchBar
              defaultValue={search}
              placeholder="Buscar por título o descripción"
              debounce={400}
              onSearch={(value) => { setPage(1); setSearch(value); }}
            />
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={tipo} onChange={(e) => { setPage(1); setTipo(e.target.value); }}>
              {TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={estado} onChange={(e) => { setPage(1); setEstado(e.target.value); }}>
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={prioridad} onChange={(e) => { setPage(1); setPrioridad(e.target.value); }}>
              {PRIORIDAD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2 ms-md-auto">
            <select className="form-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {isFetching && !isLoading && <Alert variant="info" className="py-2">Actualizando datos...</Alert>}

        <div className="card bg-light border-0 mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Resumen</h6>
              {resumen.length > 0 && <span className="text-secondary small">Total alertas: {formatNumber(total)}</span>}
            </div>
            {resumen.length === 0 ? (
              <div className="text-secondary small">Sin datos de resumen.</div>
            ) : (
              <div className="row g-2">
                {resumen.map((item) => (
                  <div key={`${item.estado}-${item.prioridad}`} className="col-12 col-md-3">
                    <div className="p-2 rounded border bg-white h-100">
                      <div className="text-secondary text-uppercase small fw-semibold mb-1">{item.estado} • {item.prioridad}</div>
                      <div className="fw-bold">{formatNumber(item.cantidad ?? 0)} alertas</div>
                    </div>
                  </div>
                ))}
                {resumenTotales.map((item) => (
                  <div key={`total-${item.estado}`} className="col-12 col-md-3">
                    <div className="p-2 rounded border bg-white h-100">
                      <div className="text-secondary text-uppercase small fw-semibold mb-1">{item.estado}</div>
                      <div className="fw-bold">{formatNumber(item.cantidad ?? 0)} alertas</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Cargando alertas..." />
        ) : items.length === 0 ? (
          <EmptyState title="Sin alertas" description="No se encontraron alertas con los filtros aplicados." icon="bi-bell" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th className="d-none d-lg-table-cell">Producto</th>
                  <th className="text-end d-none d-lg-table-cell">Fecha disparo</th>
                  <th className="text-end d-none d-xl-table-cell">Costo total</th>
                  <th className="text-end" style={{ width: 170 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((alerta) => (
                  <tr key={alerta.id}>
                    <td>#{alerta.id}</td>
                    <td>
                      <div className="fw-semibold">{alerta.titulo}</div>
                      <div className="text-secondary small">{alerta.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td className="text-capitalize">{alerta.tipo.replace('_', ' ')}</td>
                    <td className="text-capitalize">{alerta.estado}</td>
                    <td className="text-capitalize">{alerta.prioridad}</td>
                    <td className="d-none d-lg-table-cell">
                      {alerta.Producto ? (
                        <>
                          <div className="fw-semibold">{alerta.Producto.nombre}</div>
                          <div className="text-secondary small">#{alerta.Producto.codigo}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="text-end d-none d-lg-table-cell">{formatDateTime(alerta.fecha_disparo)}</td>
                    <td className="text-end d-none d-xl-table-cell">{alerta.metadata?.costo_total ? formatCurrency(alerta.metadata.costo_total) : '—'}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleMarkAsRead(alerta.id)}
                          disabled={alerta.estado !== 'activa'}
                          isLoading={markAsRead.isLoading && markAsRead.variables === alerta.id}
                        >
                          Marcar leída
                        </Button>
                        <Button
                          type="button"
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleResolve(alerta.id)}
                          disabled={alerta.estado === 'resuelta'}
                          isLoading={resolveAlert.isLoading && resolveAlert.variables === alerta.id}
                        >
                          Resolver
                        </Button>
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(alerta.id)}
                          isLoading={deleteAlert.isLoading && deleteAlert.variables === alerta.id}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-secondary small">
            Mostrando {items.length} de {total} • Página {page} / {totalPages}
          </div>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <i className="bi bi-chevron-left" /> Prev
            </button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
