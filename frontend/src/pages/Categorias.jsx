import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import CategoriaFilters from '../components/categorias/CategoriaFilters.jsx';
import CategoriaList from '../components/categorias/CategoriaList.jsx';
import CategoriaTree from '../components/categorias/CategoriaTree.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Button from '../components/ui/Button.jsx';
import { useCategoriasList, useCategoriasTree } from '../hooks/useCategorias.js';

export default function Categorias() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(() => new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state;
  const [successMsg, setSuccessMsg] = useState(navigationState?.success || '');
  const [errorMsg, setErrorMsg] = useState(navigationState?.error || '');

  const queryParams = useMemo(
    () => ({ page, limit, search: search || undefined }),
    [page, limit, search]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useCategoriasList(queryParams);

  const {
    data: treeData,
    isLoading: isTreeLoading,
    isFetching: isTreeFetching,
    refetch: refetchTree,
  } = useCategoriasTree();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listError = isError
    ? error?.response?.data?.message || error?.message || 'Error al cargar categorías'
    : '';
  const combinedError = [listError, errorMsg].filter(Boolean).join(' • ');

  const handleSearch = (value) => {
    setPage(1);
    setSearch(value);
  };

  const handleResetFilters = () => {
    setSearch('');
    setPage(1);
  };

  const handleLimitChange = (event) => {
    setPage(1);
    setLimit(Number(event.target.value));
  };

  const handlePrevPage = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setPage((prev) => Math.min(totalPages, prev + 1));

  const tree = treeData ?? [];
  const { flattenTree, parentMap } = useMemo(() => {
    const map = new Map();
    const flatten = (nodes, depth = 0, parentId = null) => nodes.flatMap((node) => {
      if (parentId !== null) {
        map.set(node.id, parentId);
      }
      const prefix = depth > 0 ? `${'› '.repeat(depth)}` : '';
      return [
        { node, option: { value: String(node.id), label: `${prefix}${node.nombre}`.trim() } },
        ...flatten(node.hijos || [], depth + 1, node.id),
      ];
    });
    return {
      flattenTree: flatten(tree, 0, null),
      parentMap: map,
    };
  }, [tree]);

  const handleSelectCategoria = (categoria) => {
    setSelected(categoria);
    setSuccessMsg('');
    setErrorMsg('');
    if (!categoria) return;
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      let current = categoria.id;
      while (parentMap.has(current)) {
        const parentId = parentMap.get(current);
        next.add(parentId);
        current = parentId;
      }
      return next;
    });
  };

  const handleEditCategoria = (categoria) => {
    setSelected(categoria);
    navigate(`/categorias/${categoria.id}/editar`);
  };

  const handleNewCategoria = () => {
    navigate('/categorias/nueva');
  };

  const handleToggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = flattenTree.map((entry) => entry.node.id);
    setExpandedNodes(new Set(allIds));
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  useEffect(() => {
    if (navigationState?.success || navigationState?.error) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [navigationState, navigate, location.pathname]);

  useEffect(() => {
    if (!isFetching && data) {
      console.info('Categorias:listado cargado', {
        total,
        visibles: items.length,
        page,
        limit,
        filtros: {
          search: search || null,
        },
      });
    }
  }, [isFetching, data, items.length, total, page, limit, search]);

  useEffect(() => {
    if (isError && error) {
      console.error('Categorias:listado error', error);
    }
  }, [isError, error]);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Categorías</h3>
        <Button variant="primary" size="sm" onClick={handleNewCategoria}>
          <i className="bi bi-plus-lg me-1" /> Nueva
        </Button>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        <CategoriaFilters
          searchKey={search}
          search={search}
          onSearch={handleSearch}
          limit={limit}
          onLimitChange={handleLimitChange}
          onReset={handleResetFilters}
        />

        <CategoriaList
          items={items}
          total={total}
          page={page}
          totalPages={totalPages}
          limit={limit}
          isLoading={isLoading && !data}
          isFetching={isFetching}
          errorMessage={combinedError}
          successMessage={successMsg}
          onSelect={handleSelectCategoria}
          onEdit={handleEditCategoria}
          selectedId={selected?.id ?? null}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      </div>

      <div className="row g-3 mt-3">
        <div className="col-12 col-lg-6">
          {isTreeLoading || isTreeFetching ? (
            <LoadingSpinner label="Cargando árbol de categorías..." />
          ) : (
            <CategoriaTree
              tree={tree}
              onRefresh={refetchTree}
              onSelect={handleSelectCategoria}
              selectedId={selected?.id ?? null}
              expandedNodes={expandedNodes}
              onToggleNode={handleToggleNode}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
            />
          )}
        </div>
        <div className="col-12 col-lg-6">
          <div className="card p-3 h-100">
            {selected ? (
              <div className="d-flex flex-column gap-3">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">{selected.nombre}</h5>
                    <Button variant="outline-secondary" size="sm" onClick={() => handleEditCategoria(selected)}>
                      <i className="bi bi-pencil me-1" /> Editar
                    </Button>
                  </div>
                  <div className="text-secondary small">ID #{selected.id}</div>
                </div>
                <div>
                  <span className="text-secondary d-block mb-1">Descripción</span>
                  <div className="fw-semibold text-break">
                    {selected.descripcion || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-secondary d-block mb-1">Nivel</span>
                  <div className="fw-semibold">{selected.nivel ?? 0}</div>
                </div>
                <div>
                  <span className="text-secondary d-block mb-1">Padre</span>
                  <div className="fw-semibold">{selected.padre?.nombre || selected.padre_id || 'Sin padre'}</div>
                </div>
              </div>
            ) : (
              <div className="h-100 d-flex align-items-center justify-content-center text-secondary text-center border border-dashed rounded-3 p-4">
                <div>
                  <i className="bi bi-diagram-3 display-6 d-block mb-2" />
                  Seleccioná una categoría para ver su detalle.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
