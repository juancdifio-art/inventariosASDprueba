import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../../hooks/useGlobalSearch.js';

export default function SearchBar({
  defaultValue = '',
  placeholder = 'Buscar...',
  onSearch,
  debounce = 0,
  enableGlobal = false,
  globalType = null,
  children,
}) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { results, search: globalSearch, isLoading, setResults } = useGlobalSearch();
  const searchTimeoutRef = useRef(null);
  const globalTimeoutRef = useRef(null);

  const triggerSearch = (nextValue) => {
    if (!onSearch) return;
    onSearch(nextValue);
  };

  const handleChange = (event) => {
    const next = event.target.value;
    setValue(next);
    if (debounce) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => triggerSearch(next), debounce);
    } else {
      triggerSearch(next);
    }

    if (enableGlobal) {
      if (globalTimeoutRef.current) clearTimeout(globalTimeoutRef.current);
      if (!next) {
        setResults([]);
      } else {
        globalTimeoutRef.current = setTimeout(() => {
          globalSearch(next, globalType);
        }, 250);
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (globalTimeoutRef.current) {
      clearTimeout(globalTimeoutRef.current);
      globalTimeoutRef.current = null;
    }
    triggerSearch(value);
    if (enableGlobal && value) globalSearch(value, globalType);
  };

  useEffect(() => {
    if (!debounce && onSearch && defaultValue) {
      triggerSearch(defaultValue);
    }
    if (enableGlobal && defaultValue) {
      globalSearch(defaultValue, globalType);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (globalTimeoutRef.current) clearTimeout(globalTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enableGlobal || !focused) {
      return () => {};
    }
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [enableGlobal, focused]);

  const handleFocus = () => {
    setFocused(true);
    if (enableGlobal && value) {
      globalSearch(value, globalType);
    }
  };

  const handleResultClick = (item) => {
    setFocused(false);
    setResults([]);
    switch (item.type) {
      case 'producto':
        navigate(`/productos/${item.id}`);
        break;
      case 'proveedor':
        navigate(`/proveedores/${item.id}/editar`);
        break;
      case 'categoria':
        navigate(`/categorias/${item.id}/editar`);
        break;
      default:
        break;
    }
  };

  return (
    <form className="search-bar position-relative" onSubmit={handleSubmit} ref={dropdownRef}>
      <div className="input-group">
        <span className="input-group-text"><i className="bi bi-search" /></span>
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
        />
        <button type="submit" className="btn btn-outline-secondary">Buscar</button>
        {children}
      </div>
      {enableGlobal && focused && (results.length > 0 || isLoading) && (
        <div className="dropdown-menu show w-100 mt-1 shadow" style={{ maxHeight: 260, overflowY: 'auto' }}>
          {isLoading && <div className="px-3 py-2 small text-secondary">Buscando...</div>}
          {!isLoading && results.length === 0 && (
            <div className="px-3 py-2 small text-secondary">Sin resultados</div>
          )}
          {!isLoading && results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              className="dropdown-item d-flex flex-column align-items-start"
              onClick={() => handleResultClick(item)}
            >
              <span className="text-uppercase small text-secondary">{item.type}</span>
              <span className="fw-semibold">{item.title}</span>
              {item.subtitle && <span className="text-secondary small">{item.subtitle}</span>}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
