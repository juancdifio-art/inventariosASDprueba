const CAMPO_NOMBRE_REGEX = /^[a-z][a-z0-9_]*$/;
const COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9()+\-\s]{6,20}$/;
const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;

export const CAMPO_TYPES = [
  'texto',
  'numero',
  'decimal',
  'fecha',
  'boolean',
  'select',
  'multi_select',
  'email',
  'telefono',
  'url',
  'color',
  'texto_largo',
];

export const APLICA_A_VALUES = ['productos', 'categorias', 'proveedores', 'movimientos', 'alertas'];

const VALIDACION_KEYS = ['min', 'max', 'minLength', 'maxLength', 'pattern'];
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const toTrimmed = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'sí', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const parseInteger = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const tryParseJson = (raw) => {
  if (raw === undefined || raw === null) return raw;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return Symbol.for('invalid-json');
  }
};

const normalizeOpciones = (input) => {
  const parsed = tryParseJson(input);
  if (parsed === Symbol.for('invalid-json')) return { value: null, invalid: true };
  if (parsed === undefined) return { value: undefined, invalid: false };
  if (parsed === null) return { value: null, invalid: false };
  if (!Array.isArray(parsed)) return { value: null, invalid: true };

  const options = parsed
    .map((opt) => {
      if (!opt || typeof opt !== 'object') return null;
      const value = toTrimmed(opt.value);
      const label = toTrimmed(opt.label);
      if (!value || !label) return null;
      return { value, label };
    })
    .filter(Boolean);

  return { value: options, invalid: false };
};

const normalizeValidaciones = (input) => {
  const parsed = tryParseJson(input);
  if (parsed === Symbol.for('invalid-json')) return { value: null, invalid: true };
  if (parsed === undefined) return { value: undefined, invalid: false };
  if (parsed === null) return { value: null, invalid: false };
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { value: null, invalid: true };

  const filtered = {};
  VALIDACION_KEYS.forEach((key) => {
    if (hasOwn(parsed, key)) filtered[key] = parsed[key];
  });

  return { value: filtered, invalid: false };
};

export const sanitizeCampoPayload = (payload = {}, { partial = false } = {}) => {
  const sanitized = {};
  const meta = { opcionesInvalidas: false, validacionesInvalidas: false };

  if (!partial || hasOwn(payload, 'nombre')) sanitized.nombre = toTrimmed(payload.nombre)?.toLowerCase() ?? '';
  if (!partial || hasOwn(payload, 'etiqueta')) sanitized.etiqueta = toTrimmed(payload.etiqueta) ?? '';
  if (!partial || hasOwn(payload, 'descripcion')) sanitized.descripcion = toTrimmed(payload.descripcion);
  if (!partial || hasOwn(payload, 'tipo')) sanitized.tipo = toTrimmed(payload.tipo)?.toLowerCase() ?? '';
  if (!partial || hasOwn(payload, 'aplica_a')) sanitized.aplica_a = toTrimmed(payload.aplica_a)?.toLowerCase() ?? 'productos';
  if (!partial || hasOwn(payload, 'grupo')) sanitized.grupo = toTrimmed(payload.grupo);
  if (!partial || hasOwn(payload, 'industria')) sanitized.industria = toTrimmed(payload.industria)?.toLowerCase() ?? null;
  if (!partial || hasOwn(payload, 'orden')) sanitized.orden = parseInteger(payload.orden, 0);
  if (!partial || hasOwn(payload, 'placeholder')) sanitized.placeholder = toTrimmed(payload.placeholder);
  if (!partial || hasOwn(payload, 'ayuda')) sanitized.ayuda = toTrimmed(payload.ayuda);
  if (!partial || hasOwn(payload, 'icono')) sanitized.icono = toTrimmed(payload.icono);

  if (!partial || hasOwn(payload, 'valor_default')) {
    const tipo = sanitized.tipo || payload.tipo;
    const raw = payload.valor_default;
    if (raw === undefined || raw === null || raw === '') {
      sanitized.valor_default = null;
    } else if (['numero'].includes(tipo)) {
      sanitized.valor_default = parseInteger(raw, null);
    } else if (['decimal'].includes(tipo)) {
      sanitized.valor_default = parseNumber(raw, null);
    } else if (tipo === 'boolean') {
      sanitized.valor_default = parseBoolean(raw, null);
    } else if (tipo === 'multi_select') {
      const values = Array.isArray(raw) ? raw : String(raw).split(',');
      sanitized.valor_default = values.map((item) => String(item).trim()).filter(Boolean);
    } else {
      sanitized.valor_default = String(raw);
    }
  }

  const opcionesResult = normalizeOpciones(payload.opciones);
  if (opcionesResult.value !== undefined) sanitized.opciones = opcionesResult.value;
  if (opcionesResult.invalid) meta.opcionesInvalidas = true;
  if (!partial && opcionesResult.value === undefined) sanitized.opciones = null;

  const validacionesResult = normalizeValidaciones(payload.validaciones);
  if (validacionesResult.value !== undefined) sanitized.validaciones = validacionesResult.value;
  if (validacionesResult.invalid) meta.validacionesInvalidas = true;
  if (!partial && validacionesResult.value === undefined) sanitized.validaciones = null;

  if (!partial || hasOwn(payload, 'obligatorio')) sanitized.obligatorio = parseBoolean(payload.obligatorio, false);
  if (!partial || hasOwn(payload, 'visible_en_listado')) sanitized.visible_en_listado = parseBoolean(payload.visible_en_listado, false);
  if (!partial || hasOwn(payload, 'visible_en_detalle')) sanitized.visible_en_detalle = parseBoolean(payload.visible_en_detalle, true);
  if (!partial || hasOwn(payload, 'activo')) sanitized.activo = parseBoolean(payload.activo, true);

  return { sanitized, meta };
};

export const validateCampoPayload = (payload = {}, { partial = false, meta = {} } = {}) => {
  const errors = [];

  if ((!partial || hasOwn(payload, 'nombre')) && !payload.nombre) errors.push('Nombre es requerido');
  if (payload.nombre && !CAMPO_NOMBRE_REGEX.test(payload.nombre)) errors.push('Nombre debe estar en snake_case y comenzar con letra');

  if ((!partial || hasOwn(payload, 'etiqueta')) && !payload.etiqueta) errors.push('Etiqueta es requerida');

  if ((!partial || hasOwn(payload, 'tipo')) && !payload.tipo) errors.push('Tipo es requerido');
  if (payload.tipo && !CAMPO_TYPES.includes(payload.tipo)) errors.push(`Tipo inválido (${payload.tipo})`);

  if ((!partial || hasOwn(payload, 'aplica_a')) && !payload.aplica_a) errors.push('aplica_a es requerido');
  if (payload.aplica_a && !APLICA_A_VALUES.includes(payload.aplica_a)) errors.push(`aplica_a inválido (${payload.aplica_a})`);

  if (payload.orden !== undefined && (typeof payload.orden !== 'number' || payload.orden < 0)) {
    errors.push('orden debe ser un entero mayor o igual a 0');
  }

  if (meta.opcionesInvalidas) errors.push('opciones debe ser un arreglo JSON válido');
  if (meta.validacionesInvalidas) errors.push('validaciones debe ser un objeto JSON válido');

  if (payload.validaciones) {
    const { min, max, minLength, maxLength, pattern } = payload.validaciones;
    if (min !== undefined && typeof min !== 'number') errors.push('validaciones.min debe ser numérico');
    if (max !== undefined && typeof max !== 'number') errors.push('validaciones.max debe ser numérico');
    if (min !== undefined && max !== undefined && typeof min === 'number' && typeof max === 'number' && min > max) {
      errors.push('validaciones.min no puede ser mayor que validaciones.max');
    }
    if (minLength !== undefined && (!Number.isInteger(minLength) || minLength < 0)) errors.push('validaciones.minLength debe ser un entero >= 0');
    if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 0)) errors.push('validaciones.maxLength debe ser un entero >= 0');
    if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) errors.push('validaciones.minLength no puede ser mayor que validaciones.maxLength');
    if (pattern !== undefined && typeof pattern !== 'string') errors.push('validaciones.pattern debe ser una cadena');
  }

  const opciones = payload.opciones;
  if (['select', 'multi_select'].includes(payload.tipo)) {
    if (!Array.isArray(opciones) || !opciones.length) {
      errors.push('opciones debe contener al menos una opción válida');
    }
  }

  if (payload.valor_default !== undefined) {
    errors.push(...validateValorDefault(payload.tipo, payload.valor_default, opciones));
  }

  if (payload.tipo === 'color' && payload.valor_default && !COLOR_REGEX.test(payload.valor_default)) {
    errors.push('valor_default debe ser un color hexadecimal válido');
  }

  return errors;
};

const validateValorDefault = (tipo, valor, opciones = []) => {
  const errors = [];
  if (valor === null || valor === undefined) return errors;

  switch (tipo) {
    case 'numero':
      if (!Number.isInteger(valor)) errors.push('valor_default debe ser entero para campos numero');
      break;
    case 'decimal':
      if (typeof valor !== 'number' || Number.isNaN(valor)) errors.push('valor_default debe ser numérico para campos decimal');
      break;
    case 'boolean':
      if (typeof valor !== 'boolean') errors.push('valor_default debe ser booleano');
      break;
    case 'select':
      if (typeof valor !== 'string') {
        errors.push('valor_default debe ser texto para campos select');
      } else if (Array.isArray(opciones) && opciones.length && !opciones.some((opt) => opt.value === valor)) {
        errors.push('valor_default debe coincidir con alguna opción disponible');
      }
      break;
    case 'multi_select':
      if (!Array.isArray(valor)) {
        errors.push('valor_default debe ser un arreglo para campos multi_select');
      } else if (Array.isArray(opciones) && opciones.length) {
        const invalid = valor.filter((item) => !opciones.some((opt) => opt.value === item));
        if (invalid.length) errors.push(`valor_default contiene opciones no válidas: ${invalid.join(', ')}`);
      }
      break;
    case 'fecha':
      if (Number.isNaN(Date.parse(valor))) errors.push('valor_default debe ser una fecha válida');
      break;
    case 'email':
      if (typeof valor !== 'string' || !EMAIL_REGEX.test(valor)) errors.push('valor_default debe ser un email válido');
      break;
    case 'telefono':
      if (typeof valor !== 'string' || !PHONE_REGEX.test(valor)) errors.push('valor_default debe ser un teléfono válido');
      break;
    case 'url':
      if (typeof valor !== 'string' || !URL_REGEX.test(valor)) errors.push('valor_default debe ser una URL válida');
      break;
    default:
      break;
  }

  return errors;
};

export const sanitizeTemplatePayload = (payload = {}, { partial = false } = {}) => {
  const sanitized = {};
  const meta = { camposConfigInvalido: false, camposMeta: [] };

  if (!partial || hasOwn(payload, 'nombre')) sanitized.nombre = toTrimmed(payload.nombre) ?? '';
  if (!partial || hasOwn(payload, 'codigo')) sanitized.codigo = toTrimmed(payload.codigo)?.toUpperCase() ?? '';
  if (!partial || hasOwn(payload, 'descripcion')) sanitized.descripcion = toTrimmed(payload.descripcion);
  if (!partial || hasOwn(payload, 'industria')) sanitized.industria = toTrimmed(payload.industria)?.toLowerCase() ?? null;
  if (!partial || hasOwn(payload, 'color')) sanitized.color = toTrimmed(payload.color);
  if (!partial || hasOwn(payload, 'activo')) sanitized.activo = parseBoolean(payload.activo, true);

  if (!partial || hasOwn(payload, 'campos_config')) {
    let raw = payload.campos_config;
    raw = tryParseJson(raw);
    if (raw === Symbol.for('invalid-json') || (raw && typeof raw === 'object' && !Array.isArray(raw))) {
      meta.camposConfigInvalido = true;
      raw = [];
    }
    const campos = Array.isArray(raw) ? raw : [];
    sanitized.campos_config = campos.map((campo, index) => {
      const defaults = {
        aplica_a: campo?.aplica_a ?? 'productos',
        grupo: campo?.grupo ?? sanitized.nombre ?? 'Campos Personalizados',
        industria: campo?.industria ?? sanitized.industria ?? null,
        orden: campo?.orden ?? index + 1,
        visible_en_listado: campo?.visible_en_listado ?? false,
        visible_en_detalle: campo?.visible_en_detalle ?? true,
        obligatorio: campo?.obligatorio ?? false,
        activo: campo?.activo ?? true,
      };
      const { sanitized: campoSanitized, meta: campoMeta } = sanitizeCampoPayload({ ...campo, ...defaults });
      meta.camposMeta.push(campoMeta);
      return campoSanitized;
    });
  }

  return { sanitized, meta };
};

export const validateTemplatePayload = (payload = {}, { partial = false, meta = {} } = {}) => {
  const errors = [];

  if ((!partial || hasOwn(payload, 'nombre')) && !payload.nombre) errors.push('Nombre de template es requerido');
  if ((!partial || hasOwn(payload, 'codigo')) && !payload.codigo) errors.push('Código de template es requerido');
  if (payload.codigo && !/^[A-Z0-9_-]+$/.test(payload.codigo)) errors.push('Código de template debe contener solo mayúsculas, números, guiones o guiones bajos');
  if (payload.color && !COLOR_REGEX.test(payload.color)) errors.push('Color debe ser un hexadecimal válido');
  if (meta.camposConfigInvalido) errors.push('campos_config debe ser un arreglo JSON válido');

  if ((!partial || hasOwn(payload, 'campos_config')) && Array.isArray(payload.campos_config)) {
    if (!payload.campos_config.length) errors.push('campos_config debe incluir al menos un campo');
    const nombres = new Set();
    payload.campos_config.forEach((campo, index) => {
      const campoMeta = meta.camposMeta?.[index] ?? {};
      const campoErrors = validateCampoPayload(campo, { partial: false, meta: campoMeta });
      if (campo.nombre) {
        if (nombres.has(campo.nombre)) errors.push(`campos_config contiene nombres duplicados (${campo.nombre})`);
        nombres.add(campo.nombre);
      }
      campoErrors.forEach((error) => errors.push(`Campo ${campo.nombre || index + 1}: ${error}`));
    });
  }

  return errors;
};

export const validateValorContraCampo = (campo, valor) => {
  const errors = [];
  const tipo = campo.tipo;
  const obligatorio = Boolean(campo.obligatorio);

  const isEmpty = valor === null || valor === undefined || (typeof valor === 'string' && !valor.trim()) || (Array.isArray(valor) && !valor.length);
  if (obligatorio && isEmpty) {
    errors.push('Valor requerido');
    return errors;
  }
  if (isEmpty) return errors;

  errors.push(...validateValorDefault(tipo, valor, campo.opciones));

  const { min, max, minLength, maxLength, pattern } = campo.validaciones || {};
  if (typeof min === 'number' && typeof valor === 'number' && valor < min) errors.push(`Debe ser >= ${min}`);
  if (typeof max === 'number' && typeof valor === 'number' && valor > max) errors.push(`Debe ser <= ${max}`);
  if (typeof minLength === 'number' && typeof valor === 'string' && valor.length < minLength) errors.push(`Debe tener al menos ${minLength} caracteres`);
  if (typeof maxLength === 'number') {
    if (typeof valor === 'string' && valor.length > maxLength) errors.push(`Debe tener como máximo ${maxLength} caracteres`);
    if (Array.isArray(valor) && valor.length > maxLength) errors.push(`Debe tener como máximo ${maxLength} elementos`);
  }
  if (pattern && typeof pattern === 'string' && typeof valor === 'string') {
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(valor)) errors.push('Formato inválido');
    } catch (err) {
      // patrón inválido, se ignora para no bloquear al usuario.
    }
  }

  if (tipo === 'color' && typeof valor === 'string' && !COLOR_REGEX.test(valor)) errors.push('Debe ser un color hexadecimal válido');
  if (tipo === 'email' && (typeof valor !== 'string' || !EMAIL_REGEX.test(valor))) errors.push('Debe ser un email válido');
  if (tipo === 'telefono' && (typeof valor !== 'string' || !PHONE_REGEX.test(valor))) errors.push('Debe ser un teléfono válido');
  if (tipo === 'url' && (typeof valor !== 'string' || !URL_REGEX.test(valor))) errors.push('Debe ser una URL válida');

  return errors;
};
