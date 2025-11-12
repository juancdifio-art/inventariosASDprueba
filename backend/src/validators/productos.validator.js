const toTrimmedString = (value, { allowEmpty = true } = {}) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!allowEmpty && trimmed.length === 0) return '';
  return trimmed;
};

const parseIntegerNullable = (value, { partial = false } = {}) => {
  if (value === undefined) return partial ? undefined : null;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const parseDecimal = (value, { partial = false, defaultValue = 0 } = {}) => {
  if (value === undefined) return partial ? undefined : defaultValue;
  if (value === null || value === '') return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const sanitizeAtributos = (value, { partial = false } = {}) => {
  if (value === undefined) return partial ? undefined : null;
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
    return value;
  }
  return null;
};

const toBoolean = (value, { partial = false, defaultValue = true } = {}) => {
  if (value === undefined) return partial ? undefined : defaultValue;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return Boolean(value);
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const sanitizeProductoPayload = (payload = {}, { partial = false } = {}) => {
  const sanitized = {};

  if (partial) {
    if (hasOwn(payload, 'codigo')) sanitized.codigo = toTrimmedString(payload.codigo);
    if (hasOwn(payload, 'nombre')) sanitized.nombre = toTrimmedString(payload.nombre);
  } else {
    sanitized.codigo = toTrimmedString(payload.codigo) ?? '';
    sanitized.nombre = toTrimmedString(payload.nombre) ?? '';
  }

  if (partial) {
    if (hasOwn(payload, 'descripcion')) {
      const trimmed = toTrimmedString(payload.descripcion);
      sanitized.descripcion = trimmed ? trimmed : null;
    }
  } else {
    const trimmed = toTrimmedString(payload.descripcion);
    sanitized.descripcion = trimmed ? trimmed : null;
  }

  const categoriaId = parseIntegerNullable(payload.categoria_id, { partial });
  if (categoriaId !== undefined) sanitized.categoria_id = categoriaId;

  const proveedorId = parseIntegerNullable(payload.proveedor_id, { partial });
  if (proveedorId !== undefined) sanitized.proveedor_id = proveedorId;

  const stockActual = parseDecimal(payload.stock_actual, { partial, defaultValue: 0 });
  if (stockActual !== undefined) sanitized.stock_actual = stockActual;

  const stockMinimo = parseDecimal(payload.stock_minimo, { partial, defaultValue: 0 });
  if (stockMinimo !== undefined) sanitized.stock_minimo = stockMinimo;

  const precio = parseDecimal(payload.precio, { partial, defaultValue: 0 });
  if (precio !== undefined) sanitized.precio = precio;

  const atributos = sanitizeAtributos(payload.atributos_personalizados, { partial });
  if (atributos !== undefined) sanitized.atributos_personalizados = atributos;

  const activo = toBoolean(payload.activo, { partial, defaultValue: true });
  if (activo !== undefined) sanitized.activo = activo;

  return sanitized;
};

export const validateProductoPayload = (payload = {}, { partial = false } = {}) => {
  const errors = [];

  if ((!partial || hasOwn(payload, 'codigo'))) {
    if (!payload.codigo || String(payload.codigo).trim().length === 0) {
      errors.push('Código es requerido');
    }
  }

  if ((!partial || hasOwn(payload, 'nombre'))) {
    if (!payload.nombre || String(payload.nombre).trim().length === 0) {
      errors.push('Nombre es requerido');
    }
  }

  if (hasOwn(payload, 'categoria_id')) {
    const value = payload.categoria_id;
    if (value !== null && (typeof value !== 'number' || Number.isNaN(value))) {
      errors.push('categoria_id debe ser numérico o null');
    }
  }

  if (hasOwn(payload, 'proveedor_id')) {
    const value = payload.proveedor_id;
    if (value !== null && (typeof value !== 'number' || Number.isNaN(value))) {
      errors.push('proveedor_id debe ser numérico o null');
    }
  }

  const checkNonNegative = (key, label) => {
    if (hasOwn(payload, key)) {
      const value = payload[key];
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`${label} debe ser un número`);
      } else if (value < 0) {
        errors.push(`${label} debe ser un número mayor o igual a 0`);
      }
    }
  };

  checkNonNegative('stock_actual', 'stock_actual');
  checkNonNegative('stock_minimo', 'stock_minimo');
  checkNonNegative('precio', 'precio');

  if (hasOwn(payload, 'atributos_personalizados')) {
    const value = payload.atributos_personalizados;
    if (value !== null && (typeof value !== 'object' || Array.isArray(value))) {
      errors.push('atributos_personalizados debe ser un objeto o null');
    }
  }

  return errors;
};
