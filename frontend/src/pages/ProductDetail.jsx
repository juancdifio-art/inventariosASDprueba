import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Alert from '../components/ui/Alert.jsx';
import ProductoCard from '../components/productos/ProductoCard.jsx';
import StockManager from '../components/productos/StockManager.jsx';
import useApiQuery from '../hooks/useApiQuery.js';
import Table from '../components/base/Table.jsx';
import { formatDateTime, formatNumber } from '../utils/formatters.js';
import DynamicFieldsSection from '../components/dynamicFields/DynamicFieldsSection.jsx';
import { useCamposPorAplicacion } from '../hooks/useConfiguracionCampos.js';
import { applyCampoDefaults, normalizeCampoGroups } from '../utils/dynamicFields.js';

export default function ProductDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('resumen');

  const productoQuery = useApiQuery(['producto', id], {
    url: `/productos/${id}`,
    enabled: Boolean(id),
  });

  const categoriasQuery = useApiQuery(['categorias', 'select'], {
    url: '/categorias',
    params: { page: 1, limit: 1000 },
    enabled: Boolean(id),
  });

  const proveedoresQuery = useApiQuery(['proveedores', 'select'], {
    url: '/proveedores',
    params: { page: 1, limit: 1000 },
    enabled: Boolean(id),
  });

  const camposQuery = useCamposPorAplicacion('productos', { agrupados: true }, { staleTime: 5 * 60 * 1000 });

  const movimientosQuery = useApiQuery(['movimientos', 'producto', id], {
    url: `/movimientos/producto/${id}`,
    params: { page: 1, limit: 10 },
    enabled: activeTab === 'stock' && Boolean(id),
    keepPreviousData: true,
  });

  const producto = productoQuery.data;
  const categorias = categoriasQuery.data?.items ?? [];
  const proveedores = proveedoresQuery.data?.items ?? [];

  const categoriaLookup = useMemo(() => {
    const map = {};
    categorias.forEach((c) => {
      if (c?.id != null) {
        map[c.id] = c.nombre;
        map[String(c.id)] = c.nombre;
      }
    });
    return map;
  }, [categorias]);

  const proveedorLookup = useMemo(() => {
    const map = {};
    proveedores.forEach((p) => {
      if (p?.id != null) {
        map[p.id] = p.nombre;
        map[String(p.id)] = p.nombre;
      }
    });
    return map;
  }, [proveedores]);

  const campoGroups = useMemo(() => {
    const normalized = normalizeCampoGroups(camposQuery.data);
    return normalized
      .map((group) => ({
        ...group,
        campos: (group.campos ?? []).filter((campo) => campo?.visible_en_detalle !== false),
      }))
      .filter((group) => group.campos.length > 0);
  }, [camposQuery.data]);

  const camposValores = useMemo(() => {
    if (!campoGroups.length) return producto?.atributos_personalizados ?? {};
    const defaults = applyCampoDefaults(campoGroups, {});
    return {
      ...defaults,
      ...(producto?.atributos_personalizados ?? {}),
    };
  }, [campoGroups, producto?.atributos_personalizados]);

  const showCamposAdicionales = campoGroups.length > 0;

  const camposErrorMessage = camposQuery.isError
    ? camposQuery.error?.response?.data?.message || camposQuery.error?.message || 'No se pudieron cargar los campos adicionales'
    : '';

  const movimientos = movimientosQuery.data?.items ?? [];

  const movimientoColumns = useMemo(() => [
    {
      key: 'id',
      label: '#',
      style: { width: 70 },
      render: (row) => `#${row.id}`,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      className: 'text-capitalize',
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      className: 'text-end',
      render: (row) => formatNumber(row.cantidad ?? 0),
    },
    {
      key: 'created_at',
      label: 'Fecha',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'motivo',
      label: 'Motivo',
      className: 'd-none d-md-table-cell',
      render: (row) => row.motivo ?? '—',
    },
    {
      key: 'referencia',
      label: 'Referencia',
      className: 'd-none d-lg-table-cell',
      render: (row) => row.referencia ?? '—',
    },
  ], []);

  const handleStockUpdated = async () => {
    await Promise.all([
      productoQuery.refetch(),
      movimientosQuery.refetch(),
    ]);
  };

  const isLoading = productoQuery.isLoading || categoriasQuery.isLoading || proveedoresQuery.isLoading;
  const errorMessage = productoQuery.isError
    ? productoQuery.error?.response?.data?.message || productoQuery.error?.message || 'Error al cargar el producto'
    : '';

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Detalle de producto</h3>
        <div className="d-flex gap-2">
          <Link to={`/productos/${id}/editar`} className="btn btn-primary btn-sm">
            <i className="bi bi-pencil me-1" /> Editar
          </Link>
          <Link to="/productos" className="btn btn-outline-secondary btn-sm">Volver</Link>
        </div>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        {errorMessage && <Alert variant="danger" className="py-2">{errorMessage}</Alert>}
        {isLoading ? (
          <LoadingSpinner label="Cargando producto..." />
        ) : !producto ? (
          <div className="text-secondary">No se encontró el producto.</div>
        ) : (
          <>
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'resumen' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resumen')}
                >
                  Resumen
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'stock' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stock')}
                >
                  Stock y movimientos
                </button>
              </li>
            </ul>

            <div className="pt-3">
              {activeTab === 'resumen' && (
                <ProductoCard
                  producto={producto}
                  categoriaNombre={categoriaLookup[producto.categoria_id]}
                  proveedorNombre={proveedorLookup[producto.proveedor_id]}
                />
              )}

              {activeTab === 'resumen' && (
                <section className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Campos personalizados</h6>
                    {camposQuery.isFetching ? (
                      <span className="text-secondary small">Actualizando...</span>
                    ) : null}
                  </div>
                  {camposQuery.isLoading ? (
                    <div className="text-secondary small">Cargando campos adicionales...</div>
                  ) : camposErrorMessage ? (
                    <Alert variant="warning" className="py-2 mb-0">{camposErrorMessage}</Alert>
                  ) : showCamposAdicionales ? (
                    <div className="border rounded-3 bg-body-secondary-subtle p-3">
                      <DynamicFieldsSection
                        groups={campoGroups}
                        values={camposValores}
                        errors={{}}
                        readOnly
                      />
                    </div>
                  ) : (
                    <Alert variant="secondary" className="py-2 mb-0">Sin campos adicionales configurados.</Alert>
                  )}
                </section>
              )}

              {activeTab === 'stock' && (
                <div className="d-flex flex-column gap-3">
                  <StockManager
                    productoId={producto.id}
                    currentStock={producto.stock_actual}
                    onUpdated={handleStockUpdated}
                  />
                  <div>
                    <h6 className="mb-2">Últimos movimientos</h6>
                    {movimientosQuery.isLoading ? (
                      <LoadingSpinner label="Cargando movimientos..." />
                    ) : movimientos.length === 0 ? (
                      <Alert variant="secondary" className="py-2 mb-0">Sin movimientos recientes.</Alert>
                    ) : (
                      <div className="table-responsive">
                        <Table columns={movimientoColumns} data={movimientos} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
