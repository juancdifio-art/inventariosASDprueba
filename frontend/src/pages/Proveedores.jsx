import { useMemo, useState, useEffect } from 'react';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ProveedorFilters,
  ProveedorList,
  ProveedorCard,
  ProveedorProductos,
} from '../components/proveedores';
import {
  useProveedoresList,
  useDeleteProveedor,
  useProductosDeProveedor,
} from '../hooks/useProveedores.js';
export default function Proveedores() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state;
  const [selected, setSelected] = useState(null);
  const [successMsg, setSuccessMsg] = useState(navigationState?.success || '');
  const [errorMsg, setErrorMsg] = useState(navigationState?.error || '');
  const [confirming, setConfirming] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [productosSearch, setProductosSearch] = useState('');
  const [productosLimit, setProductosLimit] = useState(10);
  const [productosPage, setProductosPage] = useState(1);

  const queryParams = useMemo(
    () => ({ page, limit, search: search || undefined }),
    [page, limit, search]
  );

  const productosParams = useMemo(
    () => ({ page: productosPage, limit: productosLimit, search: productosSearch || undefined }),
    [productosPage, productosLimit, productosSearch]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useProveedoresList(queryParams);

  const deleteProveedor = useDeleteProveedor();

  const selectedId = selected?.id ?? null;
  const editingId = null;
  const {
    data: productosData,
    isLoading: productosLoading,
    isFetching: productosFetching,
    refetch: refetchProductos,
    error: productosError,
  } = useProductosDeProveedor(selectedId, productosParams, { enabled: Boolean(selectedId) });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listErrorMessage = isError
    ? error?.response?.data?.message || error?.message || 'Error al cargar proveedores'
    : '';
  const productosErrorMessage = productosError
    ? productosError?.response?.data?.message || productosError?.message || 'Error al cargar productos del proveedor'
    : '';
  const combinedError = [listErrorMessage, errorMsg].filter(Boolean).join(' • ');

  const handleSearch = (value) => {
    setPage(1);
    setSearch(value);
  };

  const handleLimitChange = (event) => {
    setPage(1);
    setLimit(Number(event.target.value));
  };

  const handleResetFilters = () => {
    setSearch('');
    setPage(1);
  };

  const handlePrevPage = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setPage((prev) => Math.min(totalPages, prev + 1));

  const handleSelect = (proveedor) => {
    setSelected(proveedor);
    setProductosSearch('');
    setProductosPage(1);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleEdit = (proveedor) => {
    setSelected(proveedor);
    navigate(`/proveedores/${proveedor.id}/editar`);
  };

  const handleNewProveedor = () => {
    navigate('/proveedores/nuevo');
  };

  const handleRequestDelete = (proveedor) => {
    setDeletingId(proveedor.id);
    setConfirming(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProveedor.mutateAsync(deletingId);
      setSuccessMsg('Proveedor eliminado');
      if (selectedId === deletingId) {
        setSelected(null);
      }
    } catch (mutationError) {
      const message = mutationError?.response?.data?.message || mutationError?.message || 'Error al eliminar proveedor';
      setErrorMsg(message);
      console.error('Proveedores:eliminar error', mutationError);
    } finally {
      setConfirming(false);
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirming(false);
    setDeletingId(null);
  };

  useEffect(() => {
    if (navigationState?.success || navigationState?.error) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [navigationState, navigate, location.pathname]);

  useEffect(() => {
    if (!isFetching && data) {
      console.info('Proveedores:listado cargado', {
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
      console.error('Proveedores:listado error', error);
    }
  }, [isError, error]);

  const productos = productosData?.items ?? [];
  const productosTotal = productosData?.total ?? 0;
  const productosTotalPages = Math.max(1, Math.ceil(productosTotal / productosLimit));

  const handleProductosSearch = (value) => {
    setProductosPage(1);
    setProductosSearch(value);
  };

  const handleProductosLimitChange = (value) => {
    const parsed = Number(value.target ? value.target.value : value);
    setProductosLimit(Number.isNaN(parsed) || parsed <= 0 ? 10 : parsed);
    setProductosPage(1);
  };

  const handleProductosPrevPage = () => {
    setProductosPage((prev) => Math.max(1, prev - 1));
  };

  const handleProductosNextPage = () => {
    setProductosPage((prev) => Math.min(productosTotalPages, prev + 1));
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Proveedores</h3>
        <Button variant="primary" size="sm" onClick={handleNewProveedor}>
          <i className="bi bi-plus-lg me-1" /> Nuevo
        </Button>
      </div>
      <Breadcrumbs />

      <div className="card p-3 mb-3">
        <ProveedorFilters
          search={search}
          limit={limit}
          onSearch={handleSearch}
          onLimitChange={handleLimitChange}
          onReset={handleResetFilters}
        />

        <ProveedorList
          items={items}
          total={total}
          page={page}
          totalPages={totalPages}
          limit={limit}
          isLoading={isLoading && !data}
          isFetching={isFetching}
          errorMessage={combinedError}
          successMessage={successMsg}
          selectedId={selectedId}
          editingId={editingId}
          deletingId={deletingId}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onRequestDelete={handleRequestDelete}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      </div>

      <div className="row g-3">
        <div className="col-12">
          {selected ? (
            <div className="d-flex flex-column gap-3 h-100">
              <ProveedorCard proveedor={selected} />
              <ProveedorProductos
                productos={productos}
                total={productosTotal}
                page={productosPage}
                totalPages={productosTotalPages}
                limit={productosLimit}
                search={productosSearch}
                isLoading={productosLoading && !productosData}
                isFetching={productosFetching}
                errorMessage={productosErrorMessage}
                onRefresh={refetchProductos}
                onSearch={handleProductosSearch}
                onLimitChange={handleProductosLimitChange}
                onPrevPage={handleProductosPrevPage}
                onNextPage={handleProductosNextPage}
              />
            </div>
          ) : (
            <div className="h-100 d-flex align-items-center justify-content-center text-secondary text-center border border-dashed rounded-3 p-4">
              <div>
                <i className="bi bi-person-workspace display-6 d-block mb-2" />
                Seleccioná un proveedor de la lista para ver el detalle y sus productos asociados.
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        show={confirming}
        title="Eliminar proveedor"
        message="¿Estás seguro de eliminar este proveedor? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        disabled={deleteProveedor.isPending}
      />
    </div>
  );
}
