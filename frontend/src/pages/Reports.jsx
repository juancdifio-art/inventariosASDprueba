import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import SearchBar from '../components/base/SearchBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Table from '../components/Table.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import {
  useInventoryReport,
  useMovementsReport,
  useAlertsReport,
  useValuationReport,
  useAnalyticsReport,
} from '../hooks/useReportes.js';
import { exportReportExcel } from '../services/reportesService.js';
import { formatCurrency, formatNumber, formatPercent, formatDeltaPercent } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
const TrendChart = lazy(() => import('../components/analytics/TrendChart.jsx'));

const TABS = [
  { key: 'inventario', label: 'Inventario' },
  { key: 'movimientos', label: 'Movimientos' },
  { key: 'alertas', label: 'Alertas' },
  { key: 'valorizacion', label: 'Valorización' },
  { key: 'analytics', label: 'Analytics' },
];

const MOVIMIENTO_TIPOS = ['', 'entrada', 'salida', 'ajuste', 'transferencia_entrada', 'transferencia_salida'];
const MOVIMIENTO_AGRUPACIONES = [
  { value: 'dia', label: 'Por día' },
  { value: 'semana', label: 'Por semana' },
  { value: 'mes', label: 'Por mes' },
];

const ALERTA_ESTADOS = ['', 'activa', 'leida', 'resuelta', 'ignorada'];
const ALERTA_PRIORIDADES = ['', 'alta', 'media', 'baja'];
const ALERTA_TIPOS = ['', 'stock_minimo', 'stock_critico', 'sin_movimiento', 'vencimiento'];

const DEFAULT_ANALYTICS_FILTERS = {
  months: '12',
  comparativoWindow: '30',
  rotationWindow: '90',
  profitabilityWindow: '90',
  forecastBase: '3',
};

const ANALYTICS_MONTH_OPTIONS = [
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '18', label: '18 meses' },
  { value: '24', label: '24 meses' },
  { value: '36', label: '36 meses' },
];

const ANALYTICS_PERIOD_OPTIONS = [
  { value: '30', label: '30 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
  { value: '120', label: '120 días' },
];

const ANALYTICS_WINDOW_OPTIONS = [
  { value: '30', label: '30 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
  { value: '180', label: '180 días' },
  { value: '365', label: '365 días' },
];

const ANALYTICS_FORECAST_OPTIONS = [
  { value: '2', label: '2 meses' },
  { value: '3', label: '3 meses' },
  { value: '4', label: '4 meses' },
  { value: '6', label: '6 meses' },
];

const buildQueryParams = (filters) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== '' && value !== null && typeof value !== 'undefined'),
);

const ResumenCard = ({ title, value, icon, variant = 'primary' }) => (
  <div className={`border rounded-3 p-3 bg-${variant}-subtle`}>
    <div className="d-flex align-items-center justify-content-between">
      <div>
        <div className="text-secondary small text-uppercase fw-semibold">{title}</div>
        <div className="fs-4 fw-bold">{value}</div>
      </div>
      {icon && <i className={`bi ${icon} text-${variant}`} style={{ fontSize: 28 }} />}
    </div>
  </div>
);

export default function Reports() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const isUnauthorized = Boolean(user?.rol && !['admin', 'gerente'].includes(user.rol));

  const [activeTab, setActiveTab] = useState('inventario');

  const [inventarioFilters, setInventarioFilters] = useState({ categoria_id: '', proveedor_id: '', activo: '' });
  const [inventarioSearchKey, setInventarioSearchKey] = useState(0);
  const [inventarioSearch, setInventarioSearch] = useState('');

  const [movimientoFilters, setMovimientoFilters] = useState({ desde: '', hasta: '', tipo: '', agrupacion: 'dia' });
  const [alertaFilters, setAlertaFilters] = useState({ estado: '', prioridad: '', tipo: '', desde: '', hasta: '' });
  const [analyticsFilters, setAnalyticsFilters] = useState({ ...DEFAULT_ANALYTICS_FILTERS });
  const [drillDown, setDrillDown] = useState(null);

  const inventoryQuery = useInventoryReport(buildQueryParams(inventarioFilters), { enabled: !isUnauthorized });
  const movementsQuery = useMovementsReport(buildQueryParams(movimientoFilters), { enabled: !isUnauthorized });
  const alertsQuery = useAlertsReport(buildQueryParams(alertaFilters), { enabled: !isUnauthorized });
  const valuationQuery = useValuationReport({}, { enabled: !isUnauthorized });
  const analyticsQuery = useAnalyticsReport(buildQueryParams(analyticsFilters), { enabled: !isUnauthorized });

  const queriesByTab = {
    inventario: inventoryQuery,
    movimientos: movementsQuery,
    alertas: alertsQuery,
    valorizacion: valuationQuery,
    analytics: analyticsQuery,
  };

  const analyticsFiltersParams = useMemo(() => buildQueryParams(analyticsFilters), [analyticsFilters]);

  const currentQuery = queriesByTab[activeTab];

  const handleInventarioSearch = useCallback((value) => {
    setInventarioSearch(value.trim().toLowerCase());
  }, []);

  const filteredInventoryItems = useMemo(() => {
    const items = inventoryQuery.data?.items ?? [];
    if (!inventarioSearch) return items;
    return items.filter((item) => {
      const haystack = [
        item.codigo,
        item.nombre,
        item.categoria_nombre,
        item.proveedor_nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(inventarioSearch);
    });
  }, [inventoryQuery.data, inventarioSearch]);

  const movimientoColumns = useMemo(() => ([
    { key: 'periodo', label: 'Período' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'movimientos', label: 'Movimientos', render: (row) => formatNumber(row.movimientos) },
    { key: 'cantidad_total', label: 'Cantidad total', render: (row) => formatNumber(row.cantidad_total) },
    { key: 'costo_total', label: 'Costo total', render: (row) => formatCurrency(row.costo_total) },
  ]), []);

  const alertaColumns = useMemo(() => ([
    { key: 'tipo', label: 'Tipo' },
    { key: 'prioridad', label: 'Prioridad', render: (row) => row.prioridad?.toUpperCase() },
    { key: 'estado', label: 'Estado', render: (row) => row.estado?.toUpperCase() },
    { key: 'cantidad', label: 'Cantidad', render: (row) => formatNumber(row.cantidad) },
  ]), []);

  const topProductoColumns = useMemo(() => ([
    { key: 'nombre', label: 'Producto' },
    { key: 'codigo', label: 'Código' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'valor', label: 'Valor', render: (row) => formatCurrency(row.valor) },
  ]), []);

  const handleFiltersChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleInventarioReset = () => {
    setInventarioFilters({ categoria_id: '', proveedor_id: '', activo: '' });
    setInventarioSearch('');
    setInventarioSearchKey((prev) => prev + 1);
  };

  const handleMovimientoReset = () => {
    setMovimientoFilters({ desde: '', hasta: '', tipo: '', agrupacion: 'dia' });
  };

  const handleAlertasReset = () => {
    setAlertaFilters({ estado: '', prioridad: '', tipo: '', desde: '', hasta: '' });
  };

  const handleAnalyticsChange = (event) => {
    const { name, value } = event.target;
    setAnalyticsFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnalyticsReset = () => {
    setAnalyticsFilters({ ...DEFAULT_ANALYTICS_FILTERS });
  };

  const handleDrillDownSelect = useCallback((source, item) => {
    if (!source || !item) {
      setDrillDown(null);
      return;
    }
    setDrillDown({ source, item });
  }, []);

  const handleExport = async () => {
    try {
      const currentFilters = {
        inventario: inventarioFilters,
        movimientos: movimientoFilters,
        alertas: alertaFilters,
        valorizacion: {},
        analytics: analyticsFiltersParams,
      }[activeTab] ?? {};

      const params = buildQueryParams(currentFilters);
      const { blob, filename } = await exportReportExcel(activeTab, params);

      const blobUrl = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      addNotification({ type: 'success', message: 'Reporte exportado correctamente.' });
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'No se pudo exportar el reporte.';
      addNotification({ type: 'error', message });
    }
  };

  const renderInventarioTab = () => {
    if (inventoryQuery.isError) {
      return <Alert variant="danger">{inventoryQuery.error?.response?.data?.message || inventoryQuery.error?.message || 'Error al cargar el inventario.'}</Alert>;
    }

    if (inventoryQuery.isLoading) {
      return <LoadingSpinner label="Cargando inventario" />;
    }

    const resumen = inventoryQuery.data?.resumen ?? {};

    return (
      <>
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <ResumenCard title="Productos" value={formatNumber(resumen.totalProductos)} icon="bi-box" variant="primary" />
          </div>
          <div className="col-12 col-md-3">
            <ResumenCard title="Stock total" value={formatNumber(resumen.stockTotal)} icon="bi-archive" variant="success" />
          </div>
          <div className="col-12 col-md-3">
            <ResumenCard title="Valor total" value={formatCurrency(resumen.valorTotal)} icon="bi-currency-dollar" variant="warning" />
          </div>
          <div className="col-12 col-md-3">
            <ResumenCard title="Bajo stock" value={formatNumber(resumen.productosBajoStock)} icon="bi-exclamation-circle" variant="danger" />
          </div>
        </div>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-lg-4">
            <SearchBar
              key={`inventario-search-${inventarioSearchKey}`}
              placeholder="Buscar por código, nombre o categoría"
              debounce={300}
              onSearch={handleInventarioSearch}
            />
          </div>
          <div className="col-12 col-lg-3">
            <label className="form-label small text-secondary">Categoría ID</label>
            <input
              name="categoria_id"
              value={inventarioFilters.categoria_id}
              onChange={handleFiltersChange(setInventarioFilters)}
              className="form-control"
              placeholder="Ej: 5"
            />
          </div>
          <div className="col-12 col-lg-3">
            <label className="form-label small text-secondary">Proveedor ID</label>
            <input
              name="proveedor_id"
              value={inventarioFilters.proveedor_id}
              onChange={handleFiltersChange(setInventarioFilters)}
              className="form-control"
              placeholder="Ej: 2"
            />
          </div>
          <div className="col-12 col-lg-2">
            <label className="form-label small text-secondary">Estado</label>
            <select
              name="activo"
              value={inventarioFilters.activo}
              onChange={handleFiltersChange(setInventarioFilters)}
              className="form-select"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mb-3">
          <Button variant="outline-secondary" size="sm" onClick={handleInventarioReset}>
            <i className="bi bi-eraser me-1" /> Limpiar filtros
          </Button>
        </div>

        <div className="table-responsive">
          <Table
            columns={[
              { key: 'codigo', label: 'Código' },
              { key: 'nombre', label: 'Nombre' },
              { key: 'categoria_nombre', label: 'Categoría' },
              { key: 'proveedor_nombre', label: 'Proveedor' },
              { key: 'stock_actual', label: 'Stock', render: (row) => formatNumber(row.stock_actual) },
              { key: 'stock_minimo', label: 'Stock mínimo', render: (row) => formatNumber(row.stock_minimo) },
              { key: 'precio', label: 'Precio', render: (row) => formatCurrency(row.precio) },
            ]}
            data={filteredInventoryItems}
            emptyMessage="No se encontraron productos para los filtros seleccionados."
          />
        </div>
      </>
    );
  };

  const renderMovimientosTab = () => {
    if (movementsQuery.isError) {
      return <Alert variant="danger">{movementsQuery.error?.response?.data?.message || movementsQuery.error?.message || 'Error al cargar movimientos.'}</Alert>;
    }

    if (movementsQuery.isLoading) {
      return <LoadingSpinner label="Cargando movimientos" />;
    }

    const rows = movementsQuery.data ?? [];

    if (!rows.length) {
      return <EmptyState title="Sin movimientos" description="No se registraron movimientos con los filtros aplicados." icon="bi-activity" />;
    }

    return (
      <div className="table-responsive">
        <Table columns={movimientoColumns} data={rows} emptyMessage="Sin datos" />
      </div>
    );
  };

  const renderAlertasTab = () => {
    if (alertsQuery.isError) {
      return <Alert variant="danger">{alertsQuery.error?.response?.data?.message || alertsQuery.error?.message || 'Error al cargar alertas.'}</Alert>;
    }

    if (alertsQuery.isLoading) {
      return <LoadingSpinner label="Cargando alertas" />;
    }

    const items = alertsQuery.data?.items ?? [];
    const totales = alertsQuery.data?.totales ?? 0;

    if (!items.length) {
      return <EmptyState title="Sin alertas" description="No se encontraron alertas con los filtros aplicados." icon="bi-bell" />;
    }

    return (
      <>
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <ResumenCard title="Alertas totales" value={formatNumber(totales)} icon="bi-bell" variant="primary" />
          </div>
        </div>
        <div className="table-responsive">
          <Table columns={alertaColumns} data={items} emptyMessage="Sin alertas registradas." />
        </div>
      </>
    );
  };

  const renderValorizacionTab = () => {
    if (valuationQuery.isError) {
      return <Alert variant="danger">{valuationQuery.error?.response?.data?.message || valuationQuery.error?.message || 'Error al cargar la valorización.'}</Alert>;
    }

    if (valuationQuery.isLoading) {
      return <LoadingSpinner label="Cargando valorización" />;
    }

    const categorias = valuationQuery.data?.categorias ?? [];
    const proveedores = valuationQuery.data?.proveedores ?? [];
    const topProductos = valuationQuery.data?.topProductos ?? [];

    if (!categorias.length && !proveedores.length && !topProductos.length) {
      return <EmptyState title="Sin datos" description="No se encontraron datos para valorizar." icon="bi-graph-up" />;
    }

    return (
      <div className="d-flex flex-column gap-3">
        {categorias.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Valor por categoría</h5>
              <div className="table-responsive">
                <Table
                  columns={[
                    { key: 'nombre', label: 'Categoría' },
                    { key: 'valor', label: 'Valor', render: (row) => formatCurrency(row.valor) },
                    { key: 'productos', label: 'Productos', render: (row) => formatNumber(row.productos) },
                  ]}
                  data={categorias}
                  emptyMessage="Sin categorías"
                />
              </div>
            </div>
          </div>
        )}

        {proveedores.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Valor por proveedor</h5>
              <div className="table-responsive">
                <Table
                  columns={[
                    { key: 'nombre', label: 'Proveedor' },
                    { key: 'valor', label: 'Valor', render: (row) => formatCurrency(row.valor) },
                    { key: 'productos', label: 'Productos', render: (row) => formatNumber(row.productos) },
                  ]}
                  data={proveedores}
                  emptyMessage="Sin proveedores"
                />
              </div>
            </div>
          </div>
        )}

        {topProductos.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Top 10 productos por valor</h5>
              <div className="table-responsive">
                <Table columns={topProductoColumns} data={topProductos} emptyMessage="Sin productos" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    if (analyticsQuery.isError) {
      return <Alert variant="danger">{analyticsQuery.error?.response?.data?.message || analyticsQuery.error?.message || 'Error al cargar analytics.'}</Alert>;
    }

    if (analyticsQuery.isLoading || analyticsQuery.isFetching) {
      return <LoadingSpinner label="Cargando analytics" />;
    }

    const analytics = analyticsQuery.data ?? {};
    const {
      trends = [],
      comparativos = {},
      abc = {},
      rotation = {},
      profitability = {},
      forecast = {},
      kpis = {},
      meta = {},
    } = analytics;

    const currentMetrics = comparativos?.periodoActual?.metrics ?? {};
    const previousMetrics = comparativos?.periodoAnterior?.metrics ?? {};
    const variaciones = comparativos?.variaciones ?? {};

    const abcItems = Array.isArray(abc?.items) ? abc.items.slice(0, 15) : [];
    const rotationItems = Array.isArray(rotation?.items) ? rotation.items.slice(0, 12) : [];
    const profitabilityItems = Array.isArray(profitability?.items) ? profitability.items.slice(0, 12) : [];

    const kpiVelocity = kpis?.velocity ?? {};
    const kpiDiasInventario = kpis?.diasInventario ?? {};
    const kpiMargen = kpis?.margenPromedio ?? {};
    const kpiRotacionDestacados = Array.isArray(kpis?.rotacionDestacados) ? kpis.rotacionDestacados : [];
    const kpiTopRentables = Array.isArray(kpis?.topRentables) ? kpis.topRentables : [];

    const forecastProximo = forecast?.proximo ?? null;

    const comparativoStats = [
      { key: 'ventas', label: 'Ventas (unidades)', formatter: (value) => formatNumber(value) },
      { key: 'ingresos', label: 'Ingresos', formatter: (value) => formatCurrency(value) },
      { key: 'margen', label: 'Margen', formatter: (value) => formatCurrency(value) },
      { key: 'movimientos', label: 'Movimientos', formatter: (value) => formatNumber(value) },
    ];

    const selectedDrillDown = drillDown;

    const handleRowDrillDown = (source, item) => () => {
      handleDrillDownSelect(source, item);
    };

    const renderDrillDownDetails = () => {
      if (!selectedDrillDown) return null;
      const { source, item } = selectedDrillDown;
      if (!item) return null;

      const productId = item.id;

      const toRow = (label, value) => (
        <tr key={label}>
          <th className="text-secondary small" style={{ width: '45%' }}>{label}</th>
          <td>{value}</td>
        </tr>
      );

      let rows = [];
      switch (source) {
        case 'abc':
          rows = [
            toRow('Producto', item.nombre ?? `#${item.id}`),
            toRow('Categoría', item.categoria ?? '—'),
            toRow('Valor', formatCurrency(item.valor)),
            toRow('Participación', formatPercent(item.participacion)),
            toRow('Acumulado', formatPercent(item.acumulado)),
            toRow('Clasificación', item.categoria ?? '—'),
          ];
          break;
        case 'rotation':
          rows = [
            toRow('Producto', item.nombre ?? `#${item.id}`),
            toRow('Ventas ventana', formatNumber(item.ventas)),
            toRow('Venta diaria prom.', formatNumber(item.ventaPromDiaria, { maximumFractionDigits: 2 })),
            toRow('Rotación', Number.isFinite(Number(item.rotacion)) ? formatNumber(item.rotacion, { maximumFractionDigits: 2 }) : '—'),
            toRow('Días inventario', Number.isFinite(Number(item.diasInventario)) ? formatNumber(item.diasInventario, { maximumFractionDigits: 1 }) : '—'),
          ];
          break;
        case 'profitability':
          rows = [
            toRow('Producto', item.nombre ?? `#${item.id}`),
            toRow('Unidades', formatNumber(item.unidades)),
            toRow('Ingresos', formatCurrency(item.ingresos)),
            toRow('Costos', formatCurrency(item.costos)),
            toRow('Margen', formatCurrency(item.margen)),
            toRow('Margen %', Number.isFinite(Number(item.margenPorcentaje)) ? formatPercent(item.margenPorcentaje) : '—'),
          ];
          break;
        case 'kpi-rotation-top':
          rows = [
            toRow('Producto', item.nombre ?? `#${item.id}`),
            toRow('Rotación', Number.isFinite(Number(item.rotacion)) ? formatNumber(item.rotacion, { maximumFractionDigits: 2 }) : '—'),
            toRow('Días inventario', Number.isFinite(Number(item.diasInventario)) ? formatNumber(item.diasInventario, { maximumFractionDigits: 1 }) : '—'),
          ];
          break;
        case 'kpi-profit-top':
          rows = [
            toRow('Producto', item.nombre ?? `#${item.id}`),
            toRow('Margen', formatCurrency(item.margen)),
            toRow('Margen %', Number.isFinite(Number(item.margenPorcentaje)) ? formatPercent(item.margenPorcentaje) : '—'),
            toRow('Ingresos', formatCurrency(item.ingresos)),
          ];
          break;
        default:
          rows = Object.entries(item).map(([key, value]) => toRow(key, typeof value === 'number' ? formatNumber(value) : String(value)));
      }

      return (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Detalle seleccionado</h5>
              <div className="d-flex gap-2">
                {productId ? (
                  <Link to={`/productos/${productId}`} className="btn btn-outline-primary btn-sm">
                    Ver producto
                  </Link>
                ) : null}
                <Button variant="outline-secondary" size="sm" onClick={() => setDrillDown(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <tbody>{rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="d-flex flex-column gap-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small text-secondary">Horizonte tendencias</label>
            <select
              name="months"
              value={analyticsFilters.months}
              onChange={handleAnalyticsChange}
              className="form-select"
            >
              {ANALYTICS_MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-secondary">Ventana comparativa</label>
            <select
              name="comparativoWindow"
              value={analyticsFilters.comparativoWindow}
              onChange={handleAnalyticsChange}
              className="form-select"
            >
              {ANALYTICS_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-secondary">Ventana rotación</label>
            <select
              name="rotationWindow"
              value={analyticsFilters.rotationWindow}
              onChange={handleAnalyticsChange}
              className="form-select"
            >
              {ANALYTICS_WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-secondary">Ventana rentabilidad</label>
            <select
              name="profitabilityWindow"
              value={analyticsFilters.profitabilityWindow}
              onChange={handleAnalyticsChange}
              className="form-select"
            >
              {ANALYTICS_WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small text-secondary">Base pronóstico</label>
            <select
              name="forecastBase"
              value={analyticsFilters.forecastBase}
              onChange={handleAnalyticsChange}
              className="form-select"
            >
              {ANALYTICS_FORECAST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <Button variant="outline-secondary" size="sm" onClick={handleAnalyticsReset}>
              <i className="bi bi-eraser me-1" /> Restablecer
            </Button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="mb-0">Tendencias</h5>
                    <p className="text-secondary small mb-0">Evolución mensual de entradas, salidas, ingresos y costos.</p>
                  </div>
                  <span className="text-secondary small">Últimos {analyticsFilters.months} meses</span>
                </div>
                <Suspense fallback={<LoadingSpinner label="Cargando tendencias" />}>
                  <TrendChart data={trends} />
                </Suspense>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex flex-column gap-3">
                <div>
                  <h6 className="text-secondary text-uppercase small mb-1">Velocity de productos</h6>
                  <div className="fs-3 fw-bold">{Number.isFinite(Number(kpiVelocity?.valor)) ? `${formatNumber(kpiVelocity.valor, { maximumFractionDigits: 2 })} u/día` : '—'}</div>
                  <div className="text-secondary small">Periodo base: {kpiVelocity?.periodoDias ?? 30} días</div>
                </div>
                <div>
                  <h6 className="text-secondary text-uppercase small mb-1">Días de inventario</h6>
                  <div className="fs-3 fw-bold">{Number.isFinite(Number(kpiDiasInventario?.valor)) ? `${formatNumber(kpiDiasInventario.valor, { maximumFractionDigits: 1 })} días` : '—'}</div>
                  <div className="text-secondary small">Stock total: {formatNumber(kpiDiasInventario?.stockTotal)}</div>
                </div>
                <div>
                  <h6 className="text-secondary text-uppercase small mb-1">Margen promedio</h6>
                  <div className="fs-3 fw-bold">{Number.isFinite(Number(kpiMargen?.porcentaje)) ? formatPercent(kpiMargen.porcentaje) : '—'}</div>
                  <div className="text-secondary small">Ingresos: {formatCurrency(kpiMargen?.ingresos)} · Margen: {formatCurrency(kpiMargen?.margen)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="mb-0">Comparativo</h5>
                <p className="text-secondary small mb-0">Contrasta el desempeño actual frente al período anterior para detectar variaciones.</p>
              </div>
              <span className="text-secondary small">Ventana: {analyticsFilters.comparativoWindow} días</span>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr className="text-secondary small">
                    <th>Métrica</th>
                    <th className="text-end">Periodo actual</th>
                    <th className="text-end">Periodo anterior</th>
                    <th className="text-end">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {comparativoStats.map((stat) => {
                    const actual = currentMetrics?.[stat.key];
                    const previo = previousMetrics?.[stat.key];
                    const delta = variaciones?.[stat.key];
                    return (
                      <tr key={stat.key}>
                        <td>{stat.label}</td>
                        <td className="text-end fw-semibold">{stat.formatter(actual)}</td>
                        <td className="text-end text-secondary">{stat.formatter(previo)}</td>
                        <td className={`text-end fw-semibold ${Number(delta) >= 0 ? 'text-success' : 'text-danger'}`}>
                          {Number.isFinite(Number(delta)) ? formatDeltaPercent(delta) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td>Margen %</td>
                    <td className="text-end fw-semibold">{Number.isFinite(Number(currentMetrics?.margenPorcentaje)) ? formatPercent(currentMetrics.margenPorcentaje) : '—'}</td>
                    <td className="text-end text-secondary">{Number.isFinite(Number(previousMetrics?.margenPorcentaje)) ? formatPercent(previousMetrics.margenPorcentaje) : '—'}</td>
                    <td className="text-end text-secondary">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-xl-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="mb-0">Análisis ABC (Top 15)</h5>
                    <p className="text-secondary small mb-0">Clasifica productos según su impacto en el valor total del inventario.</p>
                  </div>
                  <span className="text-secondary small">Total valor: {formatCurrency(abc?.totalValor)}</span>
                </div>
                <div className="table-responsive" style={{ maxHeight: 320 }}>
                  <Table
                    columns={[
                      { key: 'nombre', label: 'Producto' },
                      { key: 'categoria', label: 'Categoría' },
                      { key: 'valor', label: 'Valor', render: (row) => formatCurrency(row.valor) },
                      { key: 'participacion', label: 'Participación', render: (row) => formatPercent(row.participacion) },
                      { key: 'categoria_letra', label: 'ABC', render: (row) => row.categoria },
                      {
                        key: 'detalle',
                        label: 'Detalle',
                        render: (row) => (
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleRowDrillDown('abc', row)}>
                            Analizar
                          </button>
                        ),
                      },
                    ]}
                    data={abcItems.map((item) => ({
                      ...item,
                      categoria: item.categoria,
                      categoria_letra: item.categoria,
                    }))}
                    emptyMessage="Sin datos para ABC"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="mb-0">Rotación (Top 12)</h5>
                    <p className="text-secondary small mb-0">Ordena los productos por velocidad de salida y días de inventario.</p>
                  </div>
                  <span className="text-secondary small">Ventana: {rotation?.windowDays ?? analyticsFilters.rotationWindow} días</span>
                </div>
                <div className="table-responsive" style={{ maxHeight: 320 }}>
                  <Table
                    columns={[
                      { key: 'nombre', label: 'Producto' },
                      { key: 'ventaPromDiaria', label: 'Venta diaria', render: (row) => formatNumber(row.ventaPromDiaria, { maximumFractionDigits: 2 }) },
                      { key: 'rotacion', label: 'Rotación', render: (row) => Number.isFinite(Number(row.rotacion)) ? formatNumber(row.rotacion, { maximumFractionDigits: 2 }) : '—' },
                      { key: 'diasInventario', label: 'Días inventario', render: (row) => Number.isFinite(Number(row.diasInventario)) ? formatNumber(row.diasInventario, { maximumFractionDigits: 1 }) : '—' },
                      {
                        key: 'rotation_detalle',
                        label: 'Detalle',
                        render: (row) => (
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleRowDrillDown('rotation', row)}>
                            Analizar
                          </button>
                        ),
                      },
                    ]}
                    data={rotationItems}
                    emptyMessage="Sin datos de rotación"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="mb-0">Rentabilidad (Top 12)</h5>
                <p className="text-secondary small mb-0">Identifica los productos que más aportan al margen bruto y a los ingresos.</p>
              </div>
              <span className="text-secondary small">Ventana: {profitability?.windowDays ?? analyticsFilters.profitabilityWindow} días · Margen: {Number.isFinite(Number(profitability?.margenPorcentaje)) ? formatPercent(profitability.margenPorcentaje) : '—'}</span>
            </div>
            <div className="table-responsive">
              <Table
                columns={[
                  { key: 'nombre', label: 'Producto' },
                  { key: 'unidades', label: 'Unidades', render: (row) => formatNumber(row.unidades) },
                  { key: 'ingresos', label: 'Ingresos', render: (row) => formatCurrency(row.ingresos) },
                  { key: 'margen', label: 'Margen', render: (row) => formatCurrency(row.margen) },
                  { key: 'margenPorcentaje', label: 'Margen %', render: (row) => Number.isFinite(Number(row.margenPorcentaje)) ? formatPercent(row.margenPorcentaje) : '—' },
                  {
                    key: 'profit_detalle',
                    label: 'Detalle',
                    render: (row) => (
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleRowDrillDown('profitability', row)}>
                        Analizar
                      </button>
                    ),
                  },
                ]}
                data={profitabilityItems}
                emptyMessage="Sin datos de rentabilidad"
              />
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-xl-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="mb-3">
                  <h5 className="mb-1">Pronóstico</h5>
                  <p className="text-secondary small mb-0">Proyección simple basada en los últimos meses para anticipar ventas e ingresos.</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr className="text-secondary small">
                        <th>Período</th>
                        <th className="text-end">Ventas proyectadas</th>
                        <th className="text-end">Ingresos proyectados</th>
                        <th className="text-end">Base meses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(forecast?.series) && forecast.series.length ? forecast.series.slice(-6).map((item) => (
                        <tr key={item.periodo}>
                          <td>{item.periodo}</td>
                          <td className="text-end">{formatNumber(item.ventas)}</td>
                          <td className="text-end">{formatCurrency(item.ingresos)}</td>
                          <td className="text-end text-secondary">—</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="text-center text-secondary">Sin datos históricos suficientes.</td>
                        </tr>
                      )}
                      {forecastProximo ? (
                        <tr className="table-primary">
                          <td>{forecastProximo.periodo}</td>
                          <td className="text-end fw-semibold">{formatNumber(forecastProximo.unidades)}</td>
                          <td className="text-end fw-semibold">{formatCurrency(forecastProximo.ingresos)}</td>
                          <td className="text-end text-secondary">{forecastProximo.baseMeses}</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex flex-column gap-3">
                <div>
                  <h6 className="text-secondary text-uppercase small mb-1">Destacados rotación</h6>
                  <p className="text-secondary small mb-2">Productos con mejor salida dentro de la ventana seleccionada.</p>
                  <ul className="list-unstyled mb-0 small d-grid gap-2">
                    {kpiRotacionDestacados.slice(0, 5).map((item) => (
                      <li key={item.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{item.nombre ?? `#${item.id}`}</div>
                          <div className="text-secondary">Rotación: {Number.isFinite(Number(item.rotacion)) ? formatNumber(item.rotacion, { maximumFractionDigits: 2 }) : '—'}</div>
                        </div>
                        <div className="d-flex gap-2">
                          <Link to={`/productos/${item.id}`} className="btn btn-sm btn-outline-primary">Ver</Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleDrillDownSelect('kpi-rotation-top', item)}
                          >
                            Analizar
                          </button>
                        </div>
                      </li>
                    ))}
                    {kpiRotacionDestacados.length === 0 && (
                      <li className="text-secondary">Sin datos de rotación destacados.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h6 className="text-secondary text-uppercase small mb-1">Top rentables</h6>
                  <p className="text-secondary small mb-2">Productos que concentran el mayor margen en la ventana analizada.</p>
                  <ul className="list-unstyled mb-0 small d-grid gap-2">
                    {kpiTopRentables.slice(0, 5).map((item) => (
                      <li key={item.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{item.nombre ?? `#${item.id}`}</div>
                          <div className="text-secondary">Margen: {formatCurrency(item.margen)} · {Number.isFinite(Number(item.margenPorcentaje)) ? formatPercent(item.margenPorcentaje) : '—'}</div>
                        </div>
                        <div className="d-flex gap-2">
                          <Link to={`/productos/${item.id}`} className="btn btn-sm btn-outline-primary">Ver</Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleDrillDownSelect('kpi-profit-top', item)}
                          >
                            Analizar
                          </button>
                        </div>
                      </li>
                    ))}
                    {kpiTopRentables.length === 0 && (
                      <li className="text-secondary">Sin productos rentables destacados.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {renderDrillDownDetails()}

        {meta?.filters ? (
          <div className="text-secondary small">
            Última actualización: filtros aplicados {JSON.stringify(meta.filters)}
          </div>
        ) : null}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inventario':
        return renderInventarioTab();
      case 'movimientos':
        return renderMovimientosTab();
      case 'alertas':
        return renderAlertasTab();
      case 'valorizacion':
        return renderValorizacionTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return null;
    }
  };

  const exportDisabled = currentQuery?.isLoading || currentQuery?.isFetching || currentQuery?.isError;

  if (isUnauthorized) {
    return (
      <div className="container">
        <Breadcrumbs />
        <Alert variant="warning" className="mt-3">
          No tenés permisos para acceder a los reportes.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Reportes</h3>
          <p className="text-secondary mb-0">Visualizá información clave del inventario y exportá reportes.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={handleExport} disabled={exportDisabled}>
          <i className="bi bi-file-earmark-excel me-1" /> Exportar Excel
        </Button>
      </div>
      <Breadcrumbs />

      <div className="card mt-3">
        <div className="card-header border-0 bg-transparent">
          <ul className="nav nav-pills flex-wrap gap-2">
            {TABS.map((tab) => (
              <li className="nav-item" key={tab.key}>
                <button
                  type="button"
                  className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body">
          {activeTab === 'movimientos' && (
            <div className="row g-3 align-items-end mb-3">
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Desde</label>
                <input
                  type="date"
                  name="desde"
                  value={movimientoFilters.desde}
                  onChange={handleFiltersChange(setMovimientoFilters)}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Hasta</label>
                <input
                  type="date"
                  name="hasta"
                  value={movimientoFilters.hasta}
                  onChange={handleFiltersChange(setMovimientoFilters)}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Tipo</label>
                <select
                  name="tipo"
                  value={movimientoFilters.tipo}
                  onChange={handleFiltersChange(setMovimientoFilters)}
                  className="form-select"
                >
                  {MOVIMIENTO_TIPOS.map((value) => (
                    <option key={value || 'all'} value={value}>{value ? value.toUpperCase() : 'Todos'}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Agrupación</label>
                <select
                  name="agrupacion"
                  value={movimientoFilters.agrupacion}
                  onChange={handleFiltersChange(setMovimientoFilters)}
                  className="form-select"
                >
                  {MOVIMIENTO_AGRUPACIONES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <Button variant="outline-secondary" size="sm" onClick={handleMovimientoReset}>
                  <i className="bi bi-eraser me-1" /> Limpiar filtros
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'alertas' && (
            <div className="row g-3 align-items-end mb-3">
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Estado</label>
                <select
                  name="estado"
                  value={alertaFilters.estado}
                  onChange={handleFiltersChange(setAlertaFilters)}
                  className="form-select"
                >
                  {ALERTA_ESTADOS.map((value) => (
                    <option key={value || 'all'} value={value}>{value ? value.toUpperCase() : 'Todos'}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Prioridad</label>
                <select
                  name="prioridad"
                  value={alertaFilters.prioridad}
                  onChange={handleFiltersChange(setAlertaFilters)}
                  className="form-select"
                >
                  {ALERTA_PRIORIDADES.map((value) => (
                    <option key={value || 'all'} value={value}>{value ? value.toUpperCase() : 'Todas'}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Tipo</label>
                <select
                  name="tipo"
                  value={alertaFilters.tipo}
                  onChange={handleFiltersChange(setAlertaFilters)}
                  className="form-select"
                >
                  {ALERTA_TIPOS.map((value) => (
                    <option key={value || 'all'} value={value}>{value ? value.replace('_', ' ').toUpperCase() : 'Todos'}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Desde</label>
                <input
                  type="date"
                  name="desde"
                  value={alertaFilters.desde}
                  onChange={handleFiltersChange(setAlertaFilters)}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label small text-secondary">Hasta</label>
                <input
                  type="date"
                  name="hasta"
                  value={alertaFilters.hasta}
                  onChange={handleFiltersChange(setAlertaFilters)}
                  className="form-control"
                />
              </div>
              <div className="col-12">
                <Button variant="outline-secondary" size="sm" onClick={handleAlertasReset}>
                  <i className="bi bi-eraser me-1" /> Limpiar filtros
                </Button>
              </div>
            </div>
          )}

          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
