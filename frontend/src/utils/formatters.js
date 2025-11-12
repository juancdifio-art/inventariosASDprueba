const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCurrency(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '—';
  return currencyFormatter.format(numeric);
}

export function formatNumber(value, options = {}) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('es-AR', { ...numberFormatter.resolvedOptions(), ...options }).format(numeric);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

export function formatBoolean(value, { yes = 'Sí', no = 'No' } = {}) {
  return value ? yes : no;
}

export function formatStatusBadge(value) {
  return value ? { label: 'Activo', variant: 'success' } : { label: 'Inactivo', variant: 'secondary' };
}

export function formatPercent(value, { decimals = 2, suffix = '%' } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return `${numeric.toFixed(decimals)}${suffix}`;
}

export function formatDeltaPercent(value, { decimals = 2 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  const formatted = `${numeric >= 0 ? '+' : ''}${numeric.toFixed(decimals)}%`;
  return formatted;
}
