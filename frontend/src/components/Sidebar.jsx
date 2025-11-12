import { NavLink } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ expanded, onToggle }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [localExpanded, setLocalExpanded] = useState(expanded ?? true);

  const toggle = () => {
    const next = !localExpanded;
    setLocalExpanded(next);
    onToggle?.(next);
  };

  const isExpanded = expanded ?? localExpanded;

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header p-2 d-flex align-items-center justify-content-between">
        <button className="btn btn-light btn-sm" onClick={toggle} title={isExpanded ? 'Colapsar' : 'Expandir'}>
          <i className={`bi ${isExpanded ? 'bi-chevron-left' : 'bi-chevron-right'}`} />
        </button>
      </div>
      <nav className="sidebar-nav px-2">
        <div className="d-grid gap-1">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-speedometer2 sidebar-icon" />
            <span className="sidebar-text">Dashboard</span>
          </NavLink>
          <NavLink to="/productos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-box-seam sidebar-icon" />
            <span className="sidebar-text">Productos</span>
          </NavLink>
          <NavLink to="/categorias" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-tags sidebar-icon" />
            <span className="sidebar-text">Categorías</span>
          </NavLink>
          <NavLink to="/proveedores" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-truck sidebar-icon" />
            <span className="sidebar-text">Proveedores</span>
          </NavLink>
          <NavLink to="/movimientos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-activity sidebar-icon" />
            <span className="sidebar-text">Movimientos</span>
          </NavLink>
          <NavLink to="/alertas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-bell sidebar-icon" />
            <span className="sidebar-text">Alertas</span>
          </NavLink>
          <NavLink to="/reportes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-bar-chart sidebar-icon" />
            <span className="sidebar-text">Reportes</span>
          </NavLink>
          <NavLink to="/auditorias" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-clipboard-check sidebar-icon" />
            <span className="sidebar-text">Auditorías</span>
          </NavLink>
          <div className="sidebar-section mt-3">
            <div className="sidebar-section-title text-secondary text-uppercase small fw-semibold mb-1">Configuración</div>
            <NavLink to="/configuracion" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-gear sidebar-icon" />
              <span className="sidebar-text">General</span>
            </NavLink>
            {isAdmin ? (
              <>
                <NavLink to="/configuracion-campos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-sliders sidebar-icon" />
                  <span className="sidebar-text">Campos dinámicos</span>
                </NavLink>
                <NavLink to="/importacion-exportacion" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-cloud-arrow-up sidebar-icon" />
                  <span className="sidebar-text">Importación / Exportación</span>
                </NavLink>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </aside>
  );
}
