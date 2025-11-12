import SearchBar from '../base/SearchBar.jsx';
import Button from '../ui/Button.jsx';

export default function ProveedorFilters({
  search = '',
  limit = 10,
  onSearch,
  onLimitChange,
  onReset,
}) {
  return (
    <div className="proveedor-filters d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 mb-3">
      <div className="flex-grow-1">
        <SearchBar
          defaultValue={search}
          placeholder="Buscar por nombre, email, teléfono o dirección"
          onSearch={onSearch}
          debounce={300}
        />
      </div>
      <div className="d-flex align-items-center gap-2">
        <select className="form-select" style={{ width: 110 }} value={limit} onChange={onLimitChange}>
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>
        <Button variant="outline-secondary" onClick={onReset}>
          <i className="bi bi-x-circle me-1" /> Limpiar
        </Button>
      </div>
    </div>
  );
}
