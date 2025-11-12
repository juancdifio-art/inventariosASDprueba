import { useMemo } from 'react';
import Table from '../base/Table.jsx';
import EmptyState from '../EmptyState.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';

const ROW_BASE_CLASS = 'table-row-clickable';

export default function ProveedorList({
  items = [],
  total = 0,
  page = 1,
  totalPages = 1,
  limit,
  isLoading = false,
  isFetching = false,
  errorMessage = '',
  successMessage = '',
  selectedId = null,
  editingId = null,
  deletingId = null,
  onSelect,
  onEdit,
  onRequestDelete,
  onPrevPage,
  onNextPage,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        style: { width: 70 },
        render: (row) => `#${row.id}`,
      },
      {
        key: 'nombre',
        label: 'Nombre',
        accessor: 'nombre',
      },
      {
        key: 'email',
        label: 'Email',
        className: 'd-none d-md-table-cell',
        render: (row) => row.email || '-',
      },
      {
        key: 'telefono',
        label: 'Teléfono',
        className: 'd-none d-md-table-cell',
        render: (row) => row.telefono || '-',
      },
      {
        key: 'direccion',
        label: 'Dirección',
        className: 'd-none d-lg-table-cell',
        render: (row) => row.direccion || '-',
      },
      {
        key: 'activo',
        label: 'Estado',
        style: { width: 120 },
        render: (row) => (
          <span className={`badge ${row.activo ? 'bg-success-subtle text-success fw-semibold' : 'bg-secondary-subtle text-secondary fw-semibold'}`}>
            {row.activo ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
      {
        key: 'acciones',
        label: 'Acciones',
        headerClassName: 'text-end',
        className: 'text-end',
        style: { width: 200 },
        render: (row) => (
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant={row.id === editingId ? 'secondary' : 'outline-secondary'}
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(row);
              }}
            >
              <i className="bi bi-pencil me-1" /> {row.id === editingId ? 'Editando' : 'Editar'}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onRequestDelete?.(row);
              }}
              disabled={deletingId === row.id}
            >
              {deletingId === row.id ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-trash" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [selectedId, deletingId, onSelect, onRequestDelete]
  );

  return (
    <div className="proveedor-list">
      {errorMessage && (
        <Alert variant="danger" className="py-2">
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" className="py-2">
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <LoadingSpinner label="Cargando proveedores..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin proveedores"
          description="No se encontraron proveedores para los filtros aplicados."
          icon="bi-truck"
        />
      ) : (
        <div className="table-responsive">
          <Table
            columns={columns}
            data={items}
            rowClassName={(row) => {
              const classes = [ROW_BASE_CLASS];
              if (row.id === selectedId) classes.push('table-active');
              if (editingId && row.id === editingId && row.id !== selectedId) classes.push('table-warning');
              if (!row.activo) classes.push('table-light');
              return classes.join(' ');
            }}
            rowProps={(row) => ({
              onClick: () => onSelect?.(row),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mt-2">
        <div className="text-secondary small">
          {isFetching ? 'Actualizando…' : `Mostrando ${items.length} de ${total} • Página ${page} / ${totalPages}`}
          {typeof limit !== 'undefined' ? ` • Límite ${limit}` : null}
        </div>
        <div className="btn-group">
          <Button variant="outline-secondary" size="sm" onClick={onPrevPage} disabled={page <= 1}>
            <i className="bi bi-chevron-left" /> Prev
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={onNextPage} disabled={page >= totalPages}>
            Next <i className="bi bi-chevron-right" />
          </Button>
        </div>
      </div>
    </div>
  );
}
