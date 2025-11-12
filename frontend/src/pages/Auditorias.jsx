import { useCallback, useEffect, useMemo, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import SearchBar from '../components/base/SearchBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useAuditoriasList, useAuditoriasStats } from '../hooks/useAuditorias.js';
import { formatDateTime } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';

const ACCIONES = ['', 'CREATE', 'UPDATE', 'DELETE'];
const LIMIT_OPTIONS = [20, 50, 100];

export default function Auditorias() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [tabla, setTabla] = useState('');
  const [accion, setAccion] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtros = useMemo(() => ({
    page,
    limit,
    tabla: tabla || undefined,
    accion: accion || undefined,
    usuario_id: usuarioId || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    search: search || undefined,
  }), [page, limit, tabla, accion, usuarioId, fechaDesde, fechaHasta, search]);

  const { data, isLoading, isFetching, error } = useAuditoriasList(filtros);
  const { data: statsData, isLoading: statsLoading, error: statsError } = useAuditoriasStats({
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  });

  useEffect(() => {
    if (error) {
      const message = error?.response?.data?.message || 'Error al cargar auditorías';
      addNotification({ variant: 'danger', message });
    }
  }, [error, addNotification]);

  useEffect(() => {
    if (statsError) {
      const message = statsError?.response?.data?.message || 'Error al cargar estadísticas de auditoría';
      addNotification({ variant: 'danger', message });
    }
  }, [statsError, addNotification]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const resetFilters = useCallback(() => {
    setPage(1);
    setLimit(20);
    setTabla('');
    setAccion('');
    setUsuarioId('');
    setFechaDesde('');
    setFechaHasta('');
    setSearch('');
    setSelected(null);
  }, []);

  const handleSelect = useCallback((entry) => {
    setSelected((current) => (current?.id === entry.id ? null : entry));
  }, []);

  const renderDiff = (diff) => {
    if (!diff || Object.keys(diff).length === 0) {
      return <div className="text-secondary small">Sin diferencias registradas.</div>;
    }
    return (
      <pre className="bg-light border rounded p-2 small overflow-auto" style={{ maxHeight: 300 }}>
        {JSON.stringify(diff, null, 2)}
      </pre>
    );
  };

  if (user?.rol && !['admin', 'gerente'].includes(user.rol)) {
    return (
      <div className="container">
        <Breadcrumbs />
        <Alert variant="warning" className="mt-3">
          No tenés permisos para ver el historial de auditorías.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Auditorías</h3>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-xl-4">
            <SearchBar
              defaultValue=""
              placeholder="Buscar por descripción, usuario o registro"
              debounce={400}
              onSearch={(value) => { setPage(1); setSearch(value); }}
            />
          </div>
          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label small text-secondary">Tabla</label>
            <input
              type="text"
              className="form-control"
              value={tabla}
              onChange={(e) => { setPage(1); setTabla(e.target.value); }}
              placeholder="productos, categorias..."
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small text-secondary">Acción</label>
            <select
              className="form-select"
              value={accion}
              onChange={(e) => { setPage(1); setAccion(e.target.value); }}
            >
              {ACCIONES.map((value) => (
                <option key={value || 'all'} value={value}>{value ? value : 'Todas'}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small text-secondary">Usuario ID</label>
            <input
              type="number"
              className="form-control"
              value={usuarioId}
              onChange={(e) => { setPage(1); setUsuarioId(e.target.value); }}
              min="1"
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small text-secondary">Fecha desde</label>
            <input
              type="date"
              className="form-control"
              value={fechaDesde}
              onChange={(e) => { setPage(1); setFechaDesde(e.target.value); }}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small text-secondary">Fecha hasta</label>
            <input
              type="date"
              className="form-control"
              value={fechaHasta}
              onChange={(e) => { setPage(1); setFechaHasta(e.target.value); }}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small text-secondary">Resultados por página</label>
            <select
              className="form-select"
              value={limit}
              onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
            >
              {LIMIT_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-lg-3 text-lg-end">
            <Button type="button" variant="outline-secondary" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>

        {(error || statsError) && <Alert variant="danger" className="py-2">{error?.response?.data?.message || statsError?.response?.data?.message}</Alert>}

        <div className="card bg-light border-0 mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Estadísticas</h6>
              {(statsLoading || isFetching) && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />}
            </div>
            {!statsData ? (
              <div className="text-secondary small">Sin estadísticas disponibles.</div>
            ) : (
              <div className="row g-3">
                <div className="col-12 col-lg-3">
                  <div className="p-3 rounded border bg-white h-100">
                    <div className="text-secondary text-uppercase small fw-semibold mb-1">Total registros</div>
                    <div className="display-6 mb-0">{statsData.total ?? 0}</div>
                    {statsData.ultimaActividad && (
                      <div className="text-secondary small mt-2">
                        Última actividad: {formatDateTime(statsData.ultimaActividad.fecha_cambio)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-12 col-lg-4">
                  <div className="p-3 rounded border bg-white h-100">
                    <div className="text-secondary text-uppercase small fw-semibold mb-2">Acciones</div>
                    <div className="d-flex flex-wrap gap-2">
                      {(statsData.porAccion ?? []).map((item) => (
                        <span key={item.accion} className="badge bg-primary-subtle text-primary">
                          {item.accion}: {item.cantidad}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-5">
                  <div className="p-3 rounded border bg-white h-100">
                    <div className="text-secondary text-uppercase small fw-semibold mb-2">Top tablas</div>
                    {(statsData.topTablas ?? []).length === 0 ? (
                      <div className="text-secondary small">Sin datos.</div>
                    ) : (
                      <ul className="list-unstyled mb-0 small">
                        {statsData.topTablas.map((item) => (
                          <li key={item.tabla} className="d-flex justify-content-between border-bottom py-1">
                            <span className="text-capitalize">{item.tabla}</span>
                            <span className="fw-semibold">{item.cantidad}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Cargando auditorías..." />
        ) : items.length === 0 ? (
          <EmptyState title="Sin auditorías" description="No se encontraron auditorías para los filtros aplicados." icon="bi-clipboard" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Tabla</th>
                  <th>Registro</th>
                  <th>Acción</th>
                  <th className="d-none d-md-table-cell">Usuario</th>
                  <th className="d-none d-lg-table-cell">Endpoint</th>
                  <th className="d-none d-lg-table-cell">Descripción</th>
                  <th style={{ width: 160 }}>Fecha</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? 'table-primary' : ''}>
                    <td>#{item.id}</td>
                    <td className="text-capitalize">{item.tabla}</td>
                    <td>{item.registro_id}</td>
                    <td><span className="badge bg-secondary-subtle text-secondary text-uppercase">{item.accion}</span></td>
                    <td className="d-none d-md-table-cell">
                      <div className="fw-semibold">{item.usuario_nombre || '—'}</div>
                      <div className="text-secondary small">{item.usuario_email || '—'}</div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <div>{item.metodo_http} {item.endpoint}</div>
                      <div className="text-secondary small">IP: {item.ip || '—'}</div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      {item.descripcion || <span className="text-secondary">(Sin detalle)</span>}
                    </td>
                    <td>{formatDateTime(item.fecha_cambio)}</td>
                    <td className="text-end">
                      <Button type="button" variant="outline-primary" size="sm" onClick={() => handleSelect(item)}>
                        {selected?.id === item.id ? 'Cerrar' : 'Ver'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="text-secondary small">Mostrando {items.length} de {total} • Página {page} / {totalPages}</div>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <i className="bi bi-chevron-left" /> Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>

        {selected && (
          <div className="card mt-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Detalle auditoría #{selected.id}</h6>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="border rounded p-2 h-100">
                    <div className="text-secondary text-uppercase small fw-semibold mb-2">Valores anteriores</div>
                    {selected.valores_anteriores ? (
                      <pre className="bg-light border rounded p-2 small overflow-auto" style={{ maxHeight: 300 }}>
                        {JSON.stringify(selected.valores_anteriores, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-secondary small">Sin valores previos.</div>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border rounded p-2 h-100">
                    <div className="text-secondary text-uppercase small fw-semibold mb-2">Valores nuevos</div>
                    {selected.valores_nuevos ? (
                      <pre className="bg-light border rounded p-2 small overflow-auto" style={{ maxHeight: 300 }}>
                        {JSON.stringify(selected.valores_nuevos, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-secondary small">Sin valores nuevos.</div>
                    )}
                  </div>
                </div>
                <div className="col-12">
                  <div className="border rounded p-2">
                    <div className="text-secondary text-uppercase small fw-semibold mb-2">Cambios detectados</div>
                    {renderDiff(selected.cambios)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
