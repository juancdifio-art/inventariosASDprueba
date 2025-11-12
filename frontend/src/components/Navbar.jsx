import { Link, NavLink } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import './Navbar.css';
import AlertBadge from './alertas/AlertBadge.jsx';
import SearchBar from './base/SearchBar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!showDropdown) return undefined;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const unreadCount = notifications.length;
  const recentNotifications = [...notifications].slice(-3).reverse();

  return (
    <nav className="navbar navbar-expand-lg navbar-hero sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/dashboard">Inventarios ASD</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#topNavbar" aria-controls="topNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="topNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
            </li>
          </ul>
          <div className="d-none d-lg-block me-3" style={{ minWidth: 320 }}>
            <SearchBar enableGlobal placeholder="Buscar productos, proveedores y categorías" />
          </div>
          <div className="d-flex align-items-center gap-3">
            <AlertBadge />
            <div className="dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="btn btn-link notification-button position-relative"
                aria-haspopup="true"
                aria-expanded={showDropdown}
                onClick={() => setShowDropdown((prev) => !prev)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
              >
                <i className="bi bi-bell-fill fs-5" />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadCount}
                  </span>
                )}
                <span className="visually-hidden">Abrir notificaciones</span>
              </button>
              <div
                className={`dropdown-menu dropdown-menu-end shadow border-0 ${showDropdown ? 'show' : ''}`}
                style={{ minWidth: 260 }}
              >
                <div className="px-3 py-2 border-bottom">
                  <span className="fw-semibold small text-uppercase text-secondary">Notificaciones</span>
                </div>
                {recentNotifications.length === 0 ? (
                  <div className="px-3 py-3 text-secondary small">Sin notificaciones recientes.</div>
                ) : (
                  recentNotifications.map((item) => {
                    const label = formatVariantLabel(item.variant);
                    return (
                      <div key={item.id} className="px-3 py-2 small">
                        <div className="fw-semibold text-dark">{item.message}</div>
                        {label && <div className="text-secondary text-uppercase" style={{ fontSize: 11 }}>{label}</div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <span className="text-secondary small">{user?.nombre}</span>
            <button className="btn btn-dark btn-sm" onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function formatVariantLabel(variant) {
  switch (variant) {
    case 'success':
      return 'Éxito';
    case 'danger':
    case 'error':
      return 'Error';
    case 'warning':
      return 'Advertencia';
    case 'info':
      return 'Información';
    default:
      return '';
  }
}
