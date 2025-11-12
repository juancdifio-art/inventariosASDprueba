import { useCallback, useMemo, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import SearchBar from '../components/base/SearchBar.jsx';
import { formatCurrency, formatNumber, formatDateTime } from '../utils/formatters.js';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useMovimientos } from '../hooks/useMovimientos.js';
import { useCatalogoProductos } from '../hooks/useCatalogoProductos.js';


const TIPO_OPCIONES = [
  { value: '', label: 'Todos los tipos' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'transferencia_entrada', label: 'Transferencia entrada' },
  { value: 'transferencia_salida', label: 'Transferencia salida' },
];

export default function Movimientos() {
  const { addNotification } = useNotifications();
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(20);
  const [tipo, setTipo] = useState('');
  const [productoId, setProductoId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [search, setSearch] = useState('');

  const filtros = useMemo(() => ({
    page: pagina,
    limit: limite,
    tipo: tipo || undefined,
    producto_id: productoId || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    numero_documento: numeroDocumento || undefined,
    search: search || undefined,
  }), [pagina, limite, tipo, productoId, fechaDesde, fechaHasta, numeroDocumento, search]);

  const handleError = useCallback((message) => {
    addNotification({ variant: 'danger', message });
  }, [addNotification]);

  const {
    data,
    summary,
    isLoading,
    isFetching,
    error,
    exportarCSV,
    exportarExcel,
  } = useMovimientos(filtros, {
    onError: handleError,
  });

  const { productos, isLoadingProductos } = useCatalogoProductos();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limite));

  const summaryItems = useMemo(() => summary?.items ?? [], [summary]);
  const resumenTotales = summary?.resumen ?? { totalMovimientos: 0, totalCantidad: 0, totalCosto: 0 };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Movimientos</h3>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-xl-4">
            <SearchBar
              defaultValue=""
              placeholder="Buscar por referencia o motivo"
              debounce={400}
              onSearch={(value) => { setPagina(1); setSearch(value); }}
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label small text-secondary">Tipo de movimiento</label>
            <select className="form-select" value={tipo} onChange={(e) => { setPagina(1); setTipo(e.target.value); }}>
              {TIPO_OPCIONES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label small text-secondary">Producto</label>
            <select
              className="form-select"
              value={productoId}
              onChange={(e) => { setPagina(1); setProductoId(e.target.value); }}
              disabled={isLoadingProductos}
            >
              <option value="">Todos</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>{producto.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-lg-2">
            <label className="form-label small text-secondary">Fecha desde</label>
            <input
              type="date"
              className="form-control"
              value={fechaDesde}
              onChange={(e) => { setPagina(1); setFechaDesde(e.target.value); }}
            />
          </div>
          <div className="col-6 col-lg-2">
            <label className="form-label small text-secondary">Fecha hasta</label>
            <input
              type="date"
              className="form-control"
              value={fechaHasta}
              onChange={(e) => { setPagina(1); setFechaHasta(e.target.value); }}
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label small text-secondary">N° documento / referencia</label>
            <input
              type="text"
              className="form-control"
              value={numeroDocumento}
              onChange={(e) => { setPagina(1); setNumeroDocumento(e.target.value); }}
              placeholder="Ingrese número"
            />
          </div>
          <div className="col-6 col-lg-2">
            <label className="form-label small text-secondary">Resultados por página</label>
            <select className="form-select" value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="col-12 col-lg-4 text-lg-end">
            <div className="d-flex gap-2 justify-content-lg-end">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => {
                  setPagina(1);
                  setLimite(20);
                  setTipo('');
                  setProductoId('');
                  setFechaDesde('');
                  setFechaHasta('');
                  setNumeroDocumento('');
                  setSearch('');
                }}
              >
                Limpiar filtros
              </Button>
              <Button
                type="button"
                variant="outline-primary"
                onClick={async () => {
                  try {
                    await exportarCSV();
                    addNotification({ variant: 'success', message: 'Exportación CSV iniciada' });
                  } catch (err) {
                    const message = err?.response?.data?.message || 'No se pudo exportar a CSV';
                    addNotification({ variant: 'danger', message });
                  }
                }}
              >
                <i className="bi bi-filetype-csv me-1" /> CSV
              </Button>
              <Button
                type="button"
                variant="outline-success"
                onClick={async () => {
                  try {
                    await exportarExcel();
                    addNotification({ variant: 'success', message: 'Exportación Excel iniciada' });
                  } catch (err) {
                    const message = err?.response?.data?.message || 'No se pudo exportar a Excel';
                    addNotification({ variant: 'danger', message });
                  }
                }}
              >
                <i className="bi bi-file-earmark-excel me-1" /> Excel
              </Button>
            </div>
          </div>
        </div>

        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <div className="card bg-light border-0 mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Resumen</h6>
              {isFetching && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />}
            </div>
            {summaryItems.length === 0 ? (
              <div className="text-secondary small">Sin datos de resumen.</div>
            ) : (
              <div className="row g-2">
                {summaryItems.map((item) => (
                  <div key={item.tipo} className="col-12 col-md-3">
                    <div className="p-2 rounded border bg-white h-100">
                      <div className="text-secondary text-uppercase small fw-semibold mb-1">{item.tipo.replace('_', ' ')}</div>
                      <div className="fw-bold">{formatNumber(item.movimientos ?? 0)} movs</div>
                      <div className="text-secondary small">Cantidad: {formatNumber(item.cantidad_total ?? 0)}</div>
                      <div className="text-secondary small">Costo: {formatCurrency(item.costo_total ?? 0)}</div>
                    </div>
                  </div>
                ))}
                <div className="col-12 col-md-3">
                  <div className="p-2 rounded border bg-white h-100">
                    <div className="text-secondary text-uppercase small fw-semibold mb-1">Totales</div>
                    <div className="fw-bold">{formatNumber(resumenTotales.totalMovimientos)} movs</div>
                    <div className="text-secondary small">Cantidad: {formatNumber(resumenTotales.totalCantidad)}</div>
                    <div className="text-secondary small">Costo: {formatCurrency(resumenTotales.totalCosto)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Cargando movimientos..." />
        ) : items.length === 0 ? (
          <EmptyState title="Sin movimientos" description="No se encontraron movimientos para los filtros aplicados." icon="bi-activity" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end d-none d-lg-table-cell">Stock antes</th>
                  <th className="text-end d-none d-lg-table-cell">Stock después</th>
                  <th className="text-end d-none d-md-table-cell">Costo total</th>
                  <th className="d-none d-md-table-cell">Motivo</th>
                  <th className="d-none d-md-table-cell">Referencia</th>
                  <th className="d-none d-lg-table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td>#{m.id}</td>
                    <td>
                      <div className="fw-semibold">{m.producto_nombre || '—'}</div>
                      <div className="text-secondary small">{m.producto_codigo ? `#${m.producto_codigo}` : `#${m.producto_id}`}</div>
                    </td>
                    <td className="text-capitalize">{m.tipo}</td>
                    <td className="text-end">{formatNumber(m.cantidad)}</td>
                    <td className="text-end d-none d-lg-table-cell">{formatNumber(m.stock_anterior)}</td>
                    <td className="text-end d-none d-lg-table-cell">{formatNumber(m.stock_nuevo)}</td>
                    <td className="text-end d-none d-md-table-cell">{m.costo_total != null ? formatCurrency(m.costo_total) : '—'}</td>
                    <td className="d-none d-md-table-cell">{m.motivo ?? '-'}</td>
                    <td className="d-none d-md-table-cell">{m.referencia ?? '-'}</td>
                    <td className="d-none d-lg-table-cell">{formatDateTime(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="text-secondary small">Mostrando {items.length} de {total} • Página {pagina} / {totalPages}</div>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))}>
              <i className="bi bi-chevron-left" /> Prev
            </button>
            <button className="btn btn-outline-secondary btn-sm" disabled={pagina >= totalPages} onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}>
              Next <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
