import { Link, useLocation } from 'react-router-dom';

const LABEL_MAP = {
  dashboard: 'Dashboard',
  productos: 'Productos',
  categorias: 'Categorías',
  proveedores: 'Proveedores',
  movimientos: 'Movimientos',
  nuevo: 'Nuevo',
  editar: 'Editar',
  detalle: 'Detalle',
};

const formatSegment = (segment) => {
  if (!segment) return '';
  const lower = segment.toLowerCase();
  if (LABEL_MAP[lower]) return LABEL_MAP[lower];
  if (/^\d+$/.test(segment)) return `#${segment}`;
  return lower
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = [];
  let cumulativePath = '';

  crumbs.push({ to: '/dashboard', label: LABEL_MAP.dashboard });

  segments.forEach((segment, index) => {
    cumulativePath += `/${segment}`;
    const label = formatSegment(segment);
    if (!label) return;
    crumbs.push({
      to: cumulativePath,
      label,
      isLast: index === segments.length - 1,
    });
  });

  return (
    <nav aria-label="breadcrumb" className="mt-2 mb-2">
      <ol className="breadcrumb mb-0">
        {crumbs.map(({ to, label, isLast }, idx) => (
          <li
            key={`${to}-${label}-${idx}`}
            className={`breadcrumb-item ${isLast ? 'active' : ''}`}
            aria-current={isLast ? 'page' : undefined}
          >
            {isLast ? <span>{label}</span> : <Link to={to}>{label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
