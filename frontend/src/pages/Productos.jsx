import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ProductoFilters from '../components/productos/ProductoFilters.jsx';
import ProductoList from '../components/productos/ProductoList.jsx';
import { useProductosList } from '../hooks/useProductos.js';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useCamposPorAplicacion } from '../hooks/useConfiguracionCampos.js';
import { normalizeCampoGroups, flattenCampoGroups } from '../utils/dynamicFields.js';

export default function Productos() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [stockMin, setStockMin] = useState('');
  const [stockMax, setStockMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [activo, setActivo] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);

  const queryParams = {
    page,
    limit,
    search: search || undefined,
    categoria_id: categoriaId || undefined,
    proveedor_id: proveedorId || undefined,
    min_stock: stockMin || undefined,
    max_stock: stockMax || undefined,
    min_price: priceMin || undefined,
    max_price: priceMax || undefined,
    activo: activo || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
  };

  const {
    data,
    isFetching,
    isLoading,
    isError,
    error: queryError,
    invalidate,
  } = useProductosList(queryParams);

  const camposListaQuery = useCamposPorAplicacion(
    'productos',
    { agrupados: true, solo_visibles_en_listado: true },
    { staleTime: 5 * 60 * 1000 },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const dataErrorMessage = isError ? (queryError?.response?.data?.message || queryError?.message || 'Error al cargar productos') : '';

  const camposLista = useMemo(() => {
    if (!camposListaQuery.data) return [];
    const groups = normalizeCampoGroups(camposListaQuery.data);
    const planos = flattenCampoGroups(groups);
    return planos.filter((campo) => campo?.visible_en_listado !== false && campo?.activo !== false);
  }, [camposListaQuery.data]);

  const { addNotification } = useNotifications();

  const resetPageAnd = (setter) => (value) => {
    setMsg('');
    setPage(1);
    setter(value);
  };

  const handleSearch = resetPageAnd(setSearch);
  const handleCategoriaChange = resetPageAnd((value) => setCategoriaId(value.target?.value ?? value));
  const handleProveedorChange = resetPageAnd((value) => setProveedorId(value.target?.value ?? value));
  const handleLimitChange = resetPageAnd((value) => setLimit(Number(value.target?.value ?? value)));
  const handleStockMinChange = resetPageAnd((event) => setStockMin(event.target.value));
  const handleStockMaxChange = resetPageAnd((event) => setStockMax(event.target.value));
  const handlePriceMinChange = resetPageAnd((event) => setPriceMin(event.target.value));
  const handlePriceMaxChange = resetPageAnd((event) => setPriceMax(event.target.value));
  const handleActivoChange = resetPageAnd((event) => setActivo(event.target.value));
  const handleSortByChange = (event) => {
    setMsg('');
    const next = event.target.value;
    if (next !== sortBy) {
      setSortBy(next);
      setPage(1);
    }
  };
  const handleSortDirChange = (event) => {
    setMsg('');
    const next = event.target.value;
    if (next !== sortDir) {
      setSortDir(next);
      setPage(1);
    }
  };

  const toggleSortFromHeader = (columnKey) => {
    if (!columnKey) return;
    setMsg('');
    setPage(1);
    if (sortBy === columnKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortDir('asc');
    }
  };

  const handleGoToPage = (nextPage) => {
    setPage(nextPage);
  };

  const onRequestDelete = (prod) => {
    setTargetProduct(prod);
    setShowConfirm(true);
    setError('');
    setMsg('');
  };

  const onCancelDelete = () => {
    setShowConfirm(false);
    setTargetProduct(null);
  };

  const onConfirmDelete = async () => {
    if (!targetProduct) return;
    const prod = targetProduct;
    setDeletingId(prod.id);
    try {
      await api.delete(`/productos/${prod.id}`);
      setMsg('Producto eliminado');
      addNotification({ variant: 'success', message: `Producto "${prod.nombre}" eliminado` });
      const currentTotal = total;
      const newTotal = Math.max(0, currentTotal - 1);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));
      const nextPage = Math.min(page, newTotalPages);
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await invalidate();
      }
      onCancelDelete();
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo eliminar');
      addNotification({ variant: 'danger', message: e?.response?.data?.message || 'No se pudo eliminar el producto' });
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    async function loadFilters() {
      try {
        const [cats, provs] = await Promise.all([
          api.get('/categorias', { params: { page: 1, limit: 1000 } }),
          api.get('/proveedores', { params: { page: 1, limit: 1000 } }),
        ]);
        setCategorias(cats.data.data.items || []);
        setProveedores(provs.data.data.items || []);
      } catch (error) {
        if (import.meta.env?.DEV) {
          console.warn('Productos: no se pudieron cargar filtros iniciales', error);
        }
      }
    }
    loadFilters();
  }, []);

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

  const combinedError = [dataErrorMessage, error].filter(Boolean).join(' • ');
  const showLoading = isLoading || (isFetching && !data);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Productos</h3>
        <Link to="/productos/nuevo" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1" /> Nuevo
        </Link>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        <ProductoFilters
          searchKey={String(search)}
          search={search}
          onSearch={handleSearch}
          categorias={categorias}
          categoriaId={categoriaId}
          onCategoriaChange={handleCategoriaChange}
          proveedores={proveedores}
          proveedorId={proveedorId}
          onProveedorChange={handleProveedorChange}
          limit={limit}
          onLimitChange={handleLimitChange}
          stockMin={stockMin}
          stockMax={stockMax}
          onStockMinChange={handleStockMinChange}
          onStockMaxChange={handleStockMaxChange}
          priceMin={priceMin}
          priceMax={priceMax}
          onPriceMinChange={handlePriceMinChange}
          onPriceMaxChange={handlePriceMaxChange}
          activo={activo}
          onActivoChange={handleActivoChange}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortByChange={handleSortByChange}
          onSortDirChange={handleSortDirChange}
        />

        <ProductoList
          items={items}
          total={total}
          page={page}
          totalPages={totalPages}
          limit={limit}
          isLoading={showLoading}
          isFetching={isFetching}
          errorMessage={combinedError}
          successMessage={msg}
          categoriaLookup={categoriaLookup}
          proveedorLookup={proveedorLookup}
          onRequestDelete={onRequestDelete}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
          onGoToPage={handleGoToPage}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={toggleSortFromHeader}
          camposLista={camposLista}
          camposListaError={camposListaQuery.isError ? (camposListaQuery.error?.response?.data?.message || camposListaQuery.error?.message || 'No se pudieron cargar los campos personalizados del listado') : ''}
          camposListaLoading={camposListaQuery.isFetching}
        />
      </div>
      <ConfirmModal
        show={showConfirm}
        title="Eliminar producto"
        message={
          targetProduct ? (
            <div>
              ¿Seguro que querés eliminar <strong>{targetProduct.nombre}</strong> (#{targetProduct.id})?
              <p className="mb-0 text-secondary small">Esta acción no se puede deshacer.</p>
            </div>
          ) : null
        }
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
        disabled={deletingId === targetProduct?.id}
      />
    </div>
  );
}
