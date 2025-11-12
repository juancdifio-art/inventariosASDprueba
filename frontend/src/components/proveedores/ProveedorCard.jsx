import Badge from '../ui/Badge.jsx';

export default function ProveedorCard({ proveedor }) {
  if (!proveedor) return null;

  const isActive = Boolean(proveedor.activo);

  return (
    <div className="proveedor-card card p-3 h-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 className="mb-1">{proveedor.nombre}</h4>
          {proveedor.rubro ? (
            <div className="text-secondary">Rubro: <strong>{proveedor.rubro}</strong></div>
          ) : null}
        </div>
        <Badge variant={isActive ? 'success' : 'secondary'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
      </div>

      <div className="row g-3">
        <InfoItem label="ID" value={`#${proveedor.id}`} />
        <InfoItem label="CUIT" value={proveedor.cuit || '—'} />
        <InfoItem label="Condición de pago" value={readableCondicion(proveedor.condicion_pago)} />
        <InfoItem label="Días entrega" value={typeof proveedor.dias_entrega === 'number' ? `${proveedor.dias_entrega} días` : '—'} />
        <InfoItem label="Rating" value={readableRating(proveedor.rating)} />
        <InfoItem label="Monto mínimo" value={formatCurrency(proveedor.monto_minimo)} />
      </div>

      <Section title="Contacto" icon="bi-person-lines-fill">
        <InfoList
          items={[
            { label: 'Email principal', value: proveedor.email },
            { label: 'Teléfono', value: proveedor.telefono },
            { label: 'Celular / WhatsApp', value: proveedor.celular },
            { label: 'Contacto comercial', value: proveedor.contacto },
            { label: 'Cargo', value: proveedor.cargo_contacto },
            { label: 'Email contacto', value: proveedor.email_contacto },
          ]}
        />
      </Section>

      <Section title="Ubicación y logística" icon="bi-geo-alt-fill">
        <InfoList
          items={[
            { label: 'Dirección', value: proveedor.direccion },
            { label: 'Ciudad', value: proveedor.ciudad },
            { label: 'Provincia', value: proveedor.provincia },
            { label: 'País', value: readablePais(proveedor.pais) },
            { label: 'Código postal', value: proveedor.codigo_postal },
            { label: 'Logística', value: readableLogistica(proveedor.logistica) },
            { label: 'Sitio web', value: proveedor.sitio_web ? (
              <a href={normalizeUrl(proveedor.sitio_web)} target="_blank" rel="noreferrer">
                {proveedor.sitio_web}
              </a>
            ) : null },
          ]}
        />
      </Section>

      {proveedor.notas ? (
        <Section title="Notas internas" icon="bi-journal-text">
          <p className="mb-0 text-break">{proveedor.notas}</p>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mt-3">
      <div className="text-secondary text-uppercase small fw-semibold mb-2">
        <i className={`${icon} me-2`} />
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <div className="text-secondary small mb-1">{label}</div>
      <div className="fw-semibold text-break">{value ?? '—'}</div>
    </div>
  );
}

function InfoList({ items }) {
  return (
    <div className="row g-3">
      {items.map(({ label, value }) => (
        <InfoItem key={label} label={label} value={value ?? '—'} />
      ))}
    </div>
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function readableCondicion(value) {
  switch (value) {
    case 'contado':
      return 'Contado';
    case '7_dias':
      return 'A 7 días';
    case '15_dias':
      return 'A 15 días';
    case '30_dias':
      return 'A 30 días';
    case '45_dias':
      return 'A 45 días';
    case '60_dias':
      return 'A 60 días';
    default:
      return '—';
  }
}

function readableRating(value) {
  switch (value) {
    case 'gold':
      return 'Gold';
    case 'silver':
      return 'Silver';
    case 'bronze':
      return 'Bronze';
    default:
      return 'Sin evaluar';
  }
}

function readableLogistica(value) {
  switch (value) {
    case 'propia':
      return 'Logística propia';
    case 'tercerizada':
      return 'Logística tercerizada';
    case 'mixta':
      return 'Logística mixta';
    default:
      return 'No informado';
  }
}

function readablePais(value) {
  switch (value) {
    case 'AR':
      return 'Argentina';
    case 'CL':
      return 'Chile';
    case 'UY':
      return 'Uruguay';
    case 'BR':
      return 'Brasil';
    case 'PY':
      return 'Paraguay';
    default:
      return value || '—';
  }
}

function normalizeUrl(url) {
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
