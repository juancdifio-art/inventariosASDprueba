import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Table from '../base/Table.jsx';
import EmptyState from '../EmptyState.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import Alert from '../ui/Alert.jsx';
import { formatBoolean, formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters.js';

export default function ProductoList({
  items = [],
  total = 0,
  page = 1,
  totalPages = 1,
  limit,
  isLoading = false,
  isFetching = false,
  errorMessage = '',
  successMessage = '',
  deletingId = null,
  categoriaLookup = {},
  proveedorLookup = {},
  onRequestDelete,
  onPrevPage,
  onNextPage,
  onGoToPage,
  sortBy,
  sortDir,
  onSortChange,
  camposLista = [],
  camposListaError = '',
  camposListaLoading = false,
}) {
  const normalizeCampoOptions = (opciones = []) => {
    if (!Array.isArray(opciones)) return [];
    return opciones
      .map((opt) => {
        if (!opt || typeof opt !== 'object') return null;
        const value = opt.value ?? opt.codigo ?? opt.id;
        const label = opt.label ?? opt.nombre ?? value;
        if (value === undefined || label === undefined) return null;
        return { value: String(value), label: String(label) };
      })
      .filter(Boolean);
  };

  const campoOptionsMap = useMemo(() => {
    const map = {};
    camposLista.forEach((campo) => {
      map[campo.nombre] = normalizeCampoOptions(campo.opciones);
    });
    return map;
  }, [camposLista]);

  const renderSortLabel = (sortKey, label) => {
    if (!onSortChange) return label;
    const isActive = sortBy === sortKey;
    const icon = isActive ? (sortDir === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short') : 'bi-arrow-down-up';
    return (
      <button
        type="button"
        className={`btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 ${isActive ? 'text-primary' : 'text-secondary'}`}
        onClick={() => onSortChange(sortKey)}
        title={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        <i className={`bi ${icon}`} />
      </button>
    );
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: 'id',
        label: renderSortLabel('id', 'ID'),
        style: { width: 70 },
        render: (row) => `#${row.id}`,
      },
      {
        key: 'codigo',
        label: renderSortLabel('codigo', 'Código'),
        accessor: 'codigo',
      },
      {
        key: 'nombre',
        label: renderSortLabel('nombre', 'Nombre'),
        accessor: 'nombre',
      },
      {
        key: 'categoria',
        label: 'Categoría',
        className: 'd-none d-md-table-cell',
        render: (row) => categoriaLookup[row.categoria_id] ?? row.categoria_id ?? '-',
      },
      {
        key: 'proveedor',
        label: 'Proveedor',
        className: 'd-none d-md-table-cell',
        render: (row) => proveedorLookup[row.proveedor_id] ?? row.proveedor_id ?? '-',
      },
      {
        key: 'stock',
        label: 'Stock',
        className: 'text-end',
        render: (row) => formatNumber(row.stock_actual ?? 0),
      },
      {
        key: 'precio',
        label: renderSortLabel('precio', 'Precio'),
        className: 'text-end',
        render: (row) => formatCurrency(row.precio ?? 0),
      },
    ];

    const dynamicColumns = camposLista.map((campo) => {
      const columnClassName = ['numero', 'decimal'].includes(campo.tipo)
        ? 'text-end'
        : campo.tipo === 'boolean'
          ? 'text-center'
          : '';

      return {
        key: `campo-${campo.nombre}`,
        label: campo.etiqueta ?? campo.nombre,
        className: columnClassName,
        render: (row) => {
          const raw = row?.atributos_personalizados?.[campo.nombre];
          const isEmpty = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim().length === 0) || (Array.isArray(raw) && raw.length === 0);
          if (isEmpty) return '—';

          const opciones = campoOptionsMap[campo.nombre] ?? [];

          const resolveOptionLabel = (value) => {
            const match = opciones.find((opt) => opt.value === String(value));
            return match?.label ?? String(value);
          };

          switch (campo.tipo) {
            case 'numero':
            case 'decimal':
              return formatNumber(raw);
            case 'boolean': {
              const normalized = typeof raw === 'boolean'
                ? raw
                : ['true', '1', 'yes', 'si', 'sí', 'on'].includes(String(raw).trim().toLowerCase());
              return formatBoolean(normalized);
            }
            case 'select':
              return resolveOptionLabel(raw);
            case 'multi_select': {
              const values = Array.isArray(raw) ? raw : [raw];
              const labels = values.map((value) => resolveOptionLabel(value));
              return labels.join(', ');
            }
            case 'fecha': {
              const date = raw instanceof Date ? raw : new Date(raw);
              if (Number.isNaN(date.getTime())) return String(raw);
              return formatDateTime(date).split(' ')[0];
            }
            case 'email':
              return <a href={`mailto:${raw}`}>{raw}</a>;
            case 'telefono':
              return <a href={`tel:${raw}`}>{raw}</a>;
            case 'url':
              return (
                <a href={String(raw)} target="_blank" rel="noopener noreferrer">
                  {raw}
                </a>
              );
            case 'color': {
              const color = String(raw);
              return (
                <span className="d-inline-flex align-items-center gap-2">
                  <span className="rounded-circle border" style={{ width: 14, height: 14, backgroundColor: color }} />
                  <span>{color}</span>
                </span>
              );
            }
            case 'texto_largo':
            case 'texto':
            default:
              return typeof raw === 'string' ? raw : JSON.stringify(raw);
          }
        },
      };
    });

    const accionColumn = {
      key: 'acciones',
      label: 'Acciones',
      headerClassName: 'text-end',
      className: 'text-end',
      style: { width: 190 },
      render: (row) => (
        <div className="d-flex justify-content-end gap-2">
          <Link className="btn btn-outline-secondary btn-sm" title="Ver" to={`/productos/${row.id}`}>
            <i className="bi bi-eye" />
          </Link>
          <Link className="btn btn-outline-primary btn-sm" title="Editar" to={`/productos/${row.id}/editar`}>
            <i className="bi bi-pencil" />
          </Link>
          <button
            className="btn btn-outline-danger btn-sm"
            title="Eliminar"
            onClick={() => onRequestDelete?.(row)}
            disabled={deletingId === row.id}
          >
            {deletingId === row.id ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-trash" />
            )}
          </button>
        </div>
      ),
    };

    return [...baseColumns, ...dynamicColumns, accionColumn];
  }, [camposLista, campoOptionsMap, categoriaLookup, proveedorLookup, deletingId, onRequestDelete, renderSortLabel]);

  const handleGoToPage = (nextPage) => {
    if (!nextPage || nextPage === page || nextPage < 1 || nextPage > totalPages) return;
    if (onGoToPage) {
      onGoToPage(nextPage);
      return;
    }
    if (nextPage < page) {
      onPrevPage?.();
    } else if (nextPage > page) {
      onNextPage?.();
    }
  };

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const pages = [];
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }
    return pages;
  }, [page, totalPages]);

  const hasLimit = typeof limit === 'number' && limit > 0;
  const rangeStart = hasLimit ? (page - 1) * limit + 1 : (items.length ? 1 : 0);
  const rangeEnd = hasLimit ? Math.min(rangeStart + limit - 1, total) : items.length;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="producto-list">
      {errorMessage && <Alert variant="danger" className="py-2">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success" className="py-2">{successMessage}</Alert>}
      {camposListaError && <Alert variant="warning" className="py-2">{camposListaError}</Alert>}

      {isLoading ? (
        <LoadingSpinner label="Cargando productos..." />
      ) : items.length === 0 ? (
        <EmptyState title="Sin productos" description="No se encontraron productos para los filtros aplicados." icon="bi-box" />
      ) : (
        <div className="table-responsive">
          <Table columns={columns} data={items} />
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <div className="text-secondary small">
          {isFetching ? 'Actualizando…' : (
            total === 0
              ? 'Sin resultados'
              : `Mostrando ${rangeStart}–${rangeEnd} de ${total} • Página ${page} / ${totalPages}`
          )}
          {hasLimit ? ` • Límite ${limit}` : null}
          {camposListaLoading ? ' • Cargando columnas personalizadas…' : null}
        </div>
        <nav aria-label="Paginación de productos">
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${!canPrev ? 'disabled' : ''}`}>
              <button className="page-link" type="button" onClick={() => handleGoToPage(1)} aria-label="Primera">
                <span aria-hidden="true">«</span>
              </button>
            </li>
            <li className={`page-item ${!canPrev ? 'disabled' : ''}`}>
              <button className="page-link" type="button" onClick={() => handleGoToPage(page - 1)} aria-label="Anterior">
                <span aria-hidden="true">‹</span>
              </button>
            </li>
            {pageNumbers.map((pageNumber) => (
              <li key={pageNumber} className={`page-item ${pageNumber === page ? 'active' : ''}`}>
                <button className="page-link" type="button" onClick={() => handleGoToPage(pageNumber)}>
                  {pageNumber}
                </button>
              </li>
            ))}
            <li className={`page-item ${!canNext ? 'disabled' : ''}`}>
              <button className="page-link" type="button" onClick={() => handleGoToPage(page + 1)} aria-label="Siguiente">
                <span aria-hidden="true">›</span>
              </button>
            </li>
            <li className={`page-item ${!canNext ? 'disabled' : ''}`}>
              <button className="page-link" type="button" onClick={() => handleGoToPage(totalPages)} aria-label="Última">
                <span aria-hidden="true">»</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
