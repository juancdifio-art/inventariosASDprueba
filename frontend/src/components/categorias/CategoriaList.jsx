import Table from '../base/Table.jsx';
import EmptyState from '../EmptyState.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';

const ROW_BASE_CLASS = 'table-row-clickable';

export default function CategoriaList({
  items = [],
  total = 0,
  page = 1,
  totalPages = 1,
  limit,
  isLoading = false,
  isFetching = false,
  errorMessage = '',
  successMessage = '',
  onPrevPage,
  onNextPage,
  onSelect,
  onEdit,
  selectedId = null,
}) {
  const columns = [
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
      key: 'descripcion',
      label: 'Descripción',
      className: 'd-none d-md-table-cell',
      accessor: (row) => row.descripcion ?? '-',
    },
    {
      key: 'nivel',
      label: 'Nivel',
      className: 'text-end',
      accessor: (row) => row.nivel ?? 0,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      className: 'text-end',
      style: { width: 160 },
      render: (row) => (
        <div className="d-flex justify-content-end">
          <Button
            variant={row.id === selectedId ? 'secondary' : 'outline-secondary'}
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.(row);
            }}
          >
            <i className="bi bi-pencil me-1" /> {row.id === selectedId ? 'Editando' : 'Editar'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="categoria-list">
      {errorMessage && <Alert variant="danger" className="py-2">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success" className="py-2">{successMessage}</Alert>}

      {isLoading ? (
        <LoadingSpinner label="Cargando categorías..." />
      ) : items.length === 0 ? (
        <EmptyState title="Sin categorías" description="No se encontraron categorías." icon="bi-tags" />
      ) : (
        <div className="table-responsive">
          <Table
            columns={columns}
            data={items}
            rowClassName={(row) => {
              const classes = [ROW_BASE_CLASS];
              if (row.id === selectedId) classes.push('table-active');
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
          <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={onPrevPage}>
            <i className="bi bi-chevron-left" /> Prev
          </button>
          <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={onNextPage}>
            Next <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
