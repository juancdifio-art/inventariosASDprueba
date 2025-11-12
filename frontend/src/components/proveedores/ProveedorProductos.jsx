import { useMemo } from 'react';
import Table from '../base/Table.jsx';
import EmptyState from '../EmptyState.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import Alert from '../ui/Alert.jsx';
import SearchBar from '../base/SearchBar.jsx';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ProveedorProductos({
  productos = [],
  total = 0,
  page = 1,
  totalPages = 1,
  limit = 10,
  search = '',
  isLoading = false,
  isFetching = false,
  errorMessage = '',
  onRefresh,
  onSearch,
  onLimitChange,
  onPrevPage,
  onNextPage,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        style: { width: 60 },
        render: (row) => `#${row.id}`,
      },
      {
        key: 'codigo',
        label: 'Código',
        accessor: 'codigo',
      },
      {
        key: 'nombre',
        label: 'Nombre',
        accessor: 'nombre',
      },
      {
        key: 'stock',
        label: 'Stock',
        className: 'text-end',
        render: (row) => Number(row.stock_actual ?? 0),
      },
      {
        key: 'precio',
        label: 'Precio',
        className: 'text-end',
        render: (row) => currencyFormatter.format(Number(row.precio ?? 0)),
      },
    ],
    []
  );

  return (
    <div className="proveedor-productos card h-100">
      <div className="card-header">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2">
          <h6 className="mb-0">Productos del proveedor</h6>
          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center">
            <SearchBar
              defaultValue={search}
              placeholder="Buscar producto..."
              onSearch={onSearch}
              debounce={300}
            >
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onRefresh}
                disabled={isFetching}
              >
                <i className="bi bi-arrow-clockwise me-1" /> Actualizar
              </button>
            </SearchBar>
            <div className="input-group input-group-sm" style={{ maxWidth: 160 }}>
              <span className="input-group-text">Límite</span>
              <select className="form-select" value={limit} onChange={onLimitChange}>
                {[5, 10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card-body">
        {errorMessage && (
          <Alert variant="danger" className="py-2">
            {errorMessage}
          </Alert>
        )}
        {isLoading ? (
          <LoadingSpinner label="Cargando productos..." />
        ) : productos.length === 0 ? (
          <EmptyState
            title="Sin productos"
            description="Este proveedor aún no tiene productos asociados."
            icon="bi-box"
          />
        ) : (
          <div className="table-responsive">
            <Table columns={columns} data={productos} />
          </div>
        )}
      </div>
      <div className="card-footer d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
        <div className="text-secondary small">
          {isFetching ? 'Actualizando…' : `Mostrando ${productos.length} de ${total} • Página ${page} / ${totalPages}`}
        </div>
        <div className="btn-group btn-group-sm">
          <button type="button" className="btn btn-outline-secondary" onClick={onPrevPage} disabled={page <= 1}>
            <i className="bi bi-chevron-left" /> Prev
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onNextPage} disabled={page >= totalPages}>
            Next <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
