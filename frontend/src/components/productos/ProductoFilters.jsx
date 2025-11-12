import SearchBar from '../base/SearchBar.jsx';

export default function ProductoFilters({
  searchKey,
  search,
  onSearch,
  categorias = [],
  categoriaId,
  onCategoriaChange,
  proveedores = [],
  proveedorId,
  onProveedorChange,
  limit,
  onLimitChange,
  limitOptions = [10, 20, 50],
  stockMin,
  stockMax,
  onStockMinChange,
  onStockMaxChange,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  activo,
  onActivoChange,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
}) {
  return (
    <div className="producto-filters mb-3">
      <div className="row g-2 align-items-center mb-2">
        <div className="col-12 col-lg-6">
          <SearchBar
            key={searchKey}
            defaultValue={search}
            placeholder="Buscar por nombre, código o descripción"
            onSearch={onSearch}
          />
        </div>
        <div className="col-6 col-lg-3">
          <select className="form-select" value={categoriaId} onChange={onCategoriaChange}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-lg-3">
          <select className="form-select" value={proveedorId} onChange={onProveedorChange}>
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-2 align-items-center mb-2">
        <div className="col-6 col-lg-3">
          <div className="input-group">
            <span className="input-group-text">Stock ≥</span>
            <input type="number" className="form-control" value={stockMin} onChange={onStockMinChange} min="0" />
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="input-group">
            <span className="input-group-text">Stock ≤</span>
            <input type="number" className="form-control" value={stockMax} onChange={onStockMaxChange} min="0" />
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="input-group">
            <span className="input-group-text">$ ≥</span>
            <input type="number" step="0.01" className="form-control" value={priceMin} onChange={onPriceMinChange} min="0" />
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="input-group">
            <span className="input-group-text">$ ≤</span>
            <input type="number" step="0.01" className="form-control" value={priceMax} onChange={onPriceMaxChange} min="0" />
          </div>
        </div>
      </div>

      <div className="row g-2 align-items-center">
        <div className="col-6 col-lg-3">
          <select className="form-select" value={activo} onChange={onActivoChange}>
            <option value="">Todos los estados</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
        </div>
        <div className="col-6 col-lg-3">
          <select className="form-select" value={sortBy} onChange={onSortByChange}>
            <option value="id">Orden: ID</option>
            <option value="nombre">Orden: Nombre</option>
            <option value="codigo">Orden: Código</option>
            <option value="stock_actual">Orden: Stock</option>
            <option value="precio">Orden: Precio</option>
            <option value="createdAt">Orden: Creado</option>
            <option value="updatedAt">Orden: Actualizado</option>
          </select>
        </div>
        <div className="col-6 col-lg-2">
          <select className="form-select" value={sortDir} onChange={onSortDirChange}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
        <div className="col-12 col-lg-auto ms-lg-auto">
          <select className="form-select w-100 w-lg-auto" value={limit} onChange={onLimitChange}>
            {limitOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
