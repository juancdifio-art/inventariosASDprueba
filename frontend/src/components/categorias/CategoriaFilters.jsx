import SearchBar from '../base/SearchBar.jsx';
import Button from '../ui/Button.jsx';

export default function CategoriaFilters({
  searchKey,
  search,
  onSearch,
  limit,
  onLimitChange,
  limitOptions = [10, 20, 50],
  onReset,
}) {
  return (
    <div className="categoria-filters mb-3">
      <div className="row g-2 align-items-center">
        <div className="col-12 col-md-6">
          <SearchBar
            defaultValue={search}
            placeholder="Buscar por nombre o descripción"
            onSearch={onSearch}
            debounce={300}
          >
            {onReset && (
              <Button type="button" variant="outline-secondary" onClick={onReset}>
                Limpiar
              </Button>
            )}
          </SearchBar>
        </div>
        <div className="col-auto ms-auto">
          <select className="form-select" style={{ width: 90 }} value={limit} onChange={onLimitChange}>
            {limitOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
