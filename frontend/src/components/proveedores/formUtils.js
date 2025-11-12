export const initialProveedorForm = {
  nombre: '',
  cuit: '',
  email: '',
  telefono: '',
  celular: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  pais: '',
  codigo_postal: '',
  sitio_web: '',
  contacto: '',
  cargo_contacto: '',
  email_contacto: '',
  condicion_pago: '',
  dias_entrega: '',
  rubro: '',
  logistica: '',
  logistica_contacto: '',
  rating: '',
  monto_minimo: '',
  notas: '',
  activo: true,
};

const toStringOrEmpty = (value) => (value === null || value === undefined ? '' : String(value));

export const mapProveedorToForm = (proveedor) => {
  if (!proveedor) return { ...initialProveedorForm };
  return {
    nombre: toStringOrEmpty(proveedor.nombre),
    cuit: toStringOrEmpty(proveedor.cuit),
    email: toStringOrEmpty(proveedor.email),
    telefono: toStringOrEmpty(proveedor.telefono),
    celular: toStringOrEmpty(proveedor.celular),
    direccion: toStringOrEmpty(proveedor.direccion),
    ciudad: toStringOrEmpty(proveedor.ciudad),
    provincia: toStringOrEmpty(proveedor.provincia),
    pais: toStringOrEmpty(proveedor.pais),
    codigo_postal: toStringOrEmpty(proveedor.codigo_postal),
    sitio_web: toStringOrEmpty(proveedor.sitio_web),
    contacto: toStringOrEmpty(proveedor.contacto),
    cargo_contacto: toStringOrEmpty(proveedor.cargo_contacto),
    email_contacto: toStringOrEmpty(proveedor.email_contacto),
    condicion_pago: toStringOrEmpty(proveedor.condicion_pago),
    dias_entrega: toStringOrEmpty(proveedor.dias_entrega),
    rubro: toStringOrEmpty(proveedor.rubro),
    logistica: toStringOrEmpty(proveedor.logistica),
    logistica_contacto: toStringOrEmpty(proveedor.logistica_contacto),
    rating: toStringOrEmpty(proveedor.rating),
    monto_minimo: toStringOrEmpty(proveedor.monto_minimo),
    notas: toStringOrEmpty(proveedor.notas),
    activo: typeof proveedor.activo === 'boolean' ? proveedor.activo : true,
  };
};

const normalizeStringOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const normalizeSelectOrNull = (value) => {
  if (value === undefined || value === null) return null;
  return value === '' ? null : value;
};

const parseIntegerOrNull = (value) => {
  const normalized = normalizeStringOrNull(value);
  if (normalized === null) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseDecimalOrNull = (value) => {
  const normalized = normalizeStringOrNull(value);
  if (normalized === null) return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

export const buildProveedorPayload = (formState) => ({
  nombre: formState.nombre?.trim() || '',
  cuit: normalizeStringOrNull(formState.cuit),
  email: normalizeStringOrNull(formState.email),
  telefono: normalizeStringOrNull(formState.telefono),
  celular: normalizeStringOrNull(formState.celular),
  direccion: normalizeStringOrNull(formState.direccion),
  ciudad: normalizeStringOrNull(formState.ciudad),
  provincia: normalizeStringOrNull(formState.provincia),
  pais: normalizeSelectOrNull(formState.pais),
  codigo_postal: normalizeStringOrNull(formState.codigo_postal),
  sitio_web: normalizeStringOrNull(formState.sitio_web),
  contacto: normalizeStringOrNull(formState.contacto),
  cargo_contacto: normalizeStringOrNull(formState.cargo_contacto),
  email_contacto: normalizeStringOrNull(formState.email_contacto),
  condicion_pago: normalizeSelectOrNull(formState.condicion_pago),
  dias_entrega: parseIntegerOrNull(formState.dias_entrega),
  rubro: normalizeStringOrNull(formState.rubro),
  logistica: normalizeStringOrNull(formState.logistica),
  logistica_contacto: normalizeStringOrNull(formState.logistica_contacto),
  rating: normalizeSelectOrNull(formState.rating),
  monto_minimo: parseDecimalOrNull(formState.monto_minimo),
  notas: normalizeStringOrNull(formState.notas),
  activo: Boolean(formState.activo),
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9()+\-\s]{6,20}$/;

export const validateProveedorForm = (formState) => {
  const errors = [];
  const trimmedName = formState.nombre?.trim();
  if (!trimmedName) {
    errors.push('El nombre es obligatorio');
  }

  const emailFields = [
    { value: formState.email, label: 'Email' },
    { value: formState.email_contacto, label: 'Email contacto' },
  ];

  emailFields.forEach(({ value, label }) => {
    if (value && !EMAIL_REGEX.test(value.trim())) {
      errors.push(`${label} no es válido`);
    }
  });

  const phoneFields = [
    { value: formState.telefono, label: 'Teléfono' },
    { value: formState.celular, label: 'Celular / WhatsApp' },
    { value: formState.logistica_contacto, label: 'Teléfono transporte' },
  ];

  phoneFields.forEach(({ value, label }) => {
    if (value && !PHONE_REGEX.test(value.trim())) {
      errors.push(`${label} debe tener entre 6 y 20 caracteres numéricos`);
    }
  });

  return errors;
};
