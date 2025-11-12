import Badge from '../ui/Badge.jsx';
import { formatCurrency, formatNumber, formatStatusBadge } from '../../utils/formatters.js';

export default function ProductoCard({ producto, categoriaNombre, proveedorNombre }) {
  if (!producto) return null;

  const stock = formatNumber(producto.stock_actual ?? 0);
  const stockMin = formatNumber(producto.stock_minimo ?? 0);
  const price = formatCurrency(producto.precio ?? 0);
  const status = formatStatusBadge(Boolean(producto.activo));

  return (
    <div className="producto-card">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
        <div>
          <h4 className="mb-1">{producto.nombre}</h4>
          <div className="text-secondary">Código: <strong>{producto.codigo || '-'}</strong></div>
        </div>
        <Badge variant={status.variant}>
          {status.label}
        </Badge>
      </div>

      <div className="row g-3">
        <InfoItem label="ID" value={`#${producto.id}`} />
        <InfoItem label="Categoría" value={categoriaNombre ?? producto.categoria_id ?? '-'} />
        <InfoItem label="Proveedor" value={proveedorNombre ?? producto.proveedor_id ?? '-'} />
        <InfoItem label="Stock" value={stock} />
        <InfoItem label="Stock mínimo" value={stockMin} />
        <InfoItem label="Precio" value={price} />
      </div>

      <div className="mt-3">
        <span className="text-secondary d-block mb-1">Descripción</span>
        <div className="fw-semibold text-wrap text-break">
          {producto.descripcion ? producto.descripcion : '—'}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="text-secondary mb-1">{label}</div>
      <div className="fw-semibold">{value ?? '—'}</div>
    </div>
  );
}
