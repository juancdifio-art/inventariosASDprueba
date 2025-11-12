const COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9()+\-\s]{6,20}$/;
const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;

const NUMERIC_TYPES = new Set(['numero', 'decimal']);

const normalizeOptions = (options = []) => {
  if (!Array.isArray(options)) return [];
  return options
    .map((opt) => {
      if (!opt || typeof opt !== 'object') return null;
      const value = opt.value ?? opt.codigo ?? opt.id;
      const label = opt.label ?? opt.nombre ?? value;
      if (value === undefined || label === undefined) return null;
      return { value: String(value), label: String(label) };
    })
    .filter(Boolean);
};

export const normalizeCampoGroups = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((group, index) => ({
      id: group.id ?? group.title ?? `group-${index}`,
      title: group.title ?? group.nombre ?? `Grupo ${index + 1}`,
      description: group.description ?? group.descripcion ?? '',
      icon: group.icon ?? null,
      columns: group.columns ?? 2,
      campos: Array.isArray(group.campos)
        ? [...group.campos].sort((a, b) => {
            const orderDiff = (a?.orden ?? 0) - (b?.orden ?? 0);
            if (orderDiff !== 0) return orderDiff;
            return String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es');
          })
        : [],
    }));
  }

  return Object.entries(data).map(([groupName, campos], index) => ({
    id: groupName || `group-${index}`,
    title: groupName || `Grupo ${index + 1}`,
    description: '',
    icon: null,
    columns: 2,
    campos: Array.isArray(campos)
      ? [...campos].sort((a, b) => {
          const orderDiff = (a?.orden ?? 0) - (b?.orden ?? 0);
          if (orderDiff !== 0) return orderDiff;
          return String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es');
        })
      : [],
  }));
};

export const flattenCampoGroups = (groups = []) =>
  groups.flatMap((group) => (Array.isArray(group.campos) ? group.campos : []));

export const applyCampoDefaults = (groups = [], currentValues = {}) => {
  if (!groups.length) return currentValues;
  const nextValues = { ...currentValues };
  let changed = false;

  flattenCampoGroups(groups).forEach((campo) => {
    const nombre = campo?.nombre;
    if (!nombre) return;
    if (nextValues[nombre] !== undefined) return;
    if (campo.valor_default !== undefined && campo.valor_default !== null) {
      nextValues[nombre] = campo.valor_default;
      changed = true;
    }
  });

  return changed ? nextValues : currentValues;
};

export const isValueEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export const validateCampoValor = (campo, valor) => {
  const errors = [];
  if (!campo || !campo.nombre) return errors;

  const tipo = campo.tipo ?? 'texto';
  const opciones = normalizeOptions(campo.opciones);
  const validaciones = campo.validaciones ?? {};
  const obligatorio = Boolean(campo.obligatorio);

  const empty = isValueEmpty(valor);
  if (obligatorio && empty && tipo !== 'boolean') {
    errors.push('Valor requerido');
    return errors;
  }
  if (empty) {
    if (obligatorio && tipo === 'boolean' && valor !== false) {
      errors.push('Valor requerido');
    }
    return errors;
  }

  switch (tipo) {
    case 'numero':
      if (typeof valor !== 'number' || Number.isNaN(valor) || !Number.isInteger(valor)) {
        errors.push('Debe ser un número entero');
      }
      break;
    case 'decimal':
      if (typeof valor !== 'number' || Number.isNaN(valor)) {
        errors.push('Debe ser un número válido');
      }
      break;
    case 'boolean':
      if (typeof valor !== 'boolean') errors.push('Debe ser verdadero o falso');
      break;
    case 'select': {
      const stringValue = String(valor);
      if (!opciones.length) break;
      const exists = opciones.some((opt) => opt.value === stringValue);
      if (!exists) errors.push('Debe seleccionar una opción válida');
      break;
    }
    case 'multi_select': {
      if (!Array.isArray(valor)) {
        errors.push('Debe seleccionar opciones válidas');
        break;
      }
      if (opciones.length) {
        const validSet = new Set(opciones.map((opt) => opt.value));
        const invalid = valor.filter((item) => !validSet.has(String(item)));
        if (invalid.length) errors.push('Contiene opciones no válidas');
      }
      break;
    }
    case 'fecha':
      if (Number.isNaN(Date.parse(valor))) errors.push('Debe ser una fecha válida');
      break;
    case 'email':
      if (typeof valor !== 'string' || !EMAIL_REGEX.test(valor)) errors.push('Debe ser un email válido');
      break;
    case 'telefono':
      if (typeof valor !== 'string' || !PHONE_REGEX.test(valor)) errors.push('Debe ser un teléfono válido');
      break;
    case 'url':
      if (typeof valor !== 'string' || !URL_REGEX.test(valor)) errors.push('Debe ser una URL válida');
      break;
    case 'color':
      if (typeof valor !== 'string' || !COLOR_REGEX.test(valor)) errors.push('Debe ser un color hexadecimal válido');
      break;
    default:
      // texto, texto_largo u otros tipos se validan más abajo
      break;
  }

  const { min, max, minLength, maxLength, pattern } = validaciones;

  if (typeof valor === 'number') {
    if (typeof min === 'number' && valor < min) errors.push(`Debe ser >= ${min}`);
    if (typeof max === 'number' && valor > max) errors.push(`Debe ser <= ${max}`);
  }

  if (typeof valor === 'string') {
    if (typeof minLength === 'number' && valor.length < minLength) {
      errors.push(`Debe tener al menos ${minLength} caracteres`);
    }
    if (typeof maxLength === 'number' && valor.length > maxLength) {
      errors.push(`Debe tener como máximo ${maxLength} caracteres`);
    }
    if (pattern && typeof pattern === 'string') {
      try {
        const regex = new RegExp(pattern);
        if (!regex.test(valor)) errors.push('Formato inválido');
      } catch {
        // patrón inválido, se ignora
      }
    }
  }

  if (Array.isArray(valor)) {
    if (typeof minLength === 'number' && valor.length < minLength) {
      errors.push(`Debe seleccionar al menos ${minLength} opciones`);
    }
    if (typeof maxLength === 'number' && valor.length > maxLength) {
      errors.push(`Debe seleccionar como máximo ${maxLength} opciones`);
    }
  }

  return errors;
};

export const validateCamposValues = (campos = [], valores = {}) => {
  const errors = {};
  campos.forEach((campo) => {
    if (!campo?.nombre) return;
    const fieldErrors = validateCampoValor(campo, valores[campo.nombre]);
    if (fieldErrors.length) {
      errors[campo.nombre] = fieldErrors[0];
    }
  });
  return errors;
};

const parseNumericValue = (valor, tipo) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim().length) {
    const parsed = tipo === 'numero' ? Number.parseInt(valor, 10) : Number(valor);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const buildAtributosPayload = (campos = [], valores = {}) => {
  const payload = {};

  campos.forEach((campo) => {
    const nombre = campo?.nombre;
    if (!nombre) return;
    const rawValue = valores[nombre];

    if (isValueEmpty(rawValue) && campo.tipo !== 'boolean') return;

    let value = rawValue;

    switch (campo.tipo) {
      case 'numero': {
        const parsed = parseNumericValue(rawValue, 'numero');
        if (parsed === null) return;
        value = parsed;
        break;
      }
      case 'decimal': {
        const parsed = parseNumericValue(rawValue, 'decimal');
        if (parsed === null) return;
        value = parsed;
        break;
      }
      case 'boolean':
        value = Boolean(rawValue);
        break;
      case 'multi_select':
        if (!Array.isArray(rawValue) || !rawValue.length) return;
        value = rawValue.map((item) => String(item));
        break;
      case 'select':
        if (typeof rawValue !== 'string' || !rawValue.trim().length) return;
        value = rawValue;
        break;
      case 'fecha':
      case 'email':
      case 'telefono':
      case 'url':
      case 'color':
      case 'texto_largo':
      case 'texto':
      default:
        if (typeof rawValue === 'string') {
          const trimmed = rawValue.trim();
          if (!trimmed.length) return;
          value = trimmed;
        }
        break;
    }

    if (value !== undefined) {
      payload[nombre] = value;
    }
  });

  return Object.keys(payload).length ? payload : null;
};

export const hasNumericCampos = (campos = []) => campos.some((campo) => NUMERIC_TYPES.has(campo?.tipo));
