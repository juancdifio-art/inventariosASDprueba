import { Auditoria } from '../models/index.js';

function computeDiff(oldValues = {}, newValues = {}) {
  const diff = {};
  const keys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);
  keys.forEach((key) => {
    const previousValue = oldValues ? oldValues[key] : undefined;
    const currentValue = newValues ? newValues[key] : undefined;
    if (JSON.stringify(previousValue) !== JSON.stringify(currentValue)) {
      diff[key] = { before: previousValue ?? null, after: currentValue ?? null };
    }
  });
  return Object.keys(diff).length ? diff : null;
}

const truncate = (value, max) => {
  if (value === undefined || value === null) return value;
  const str = String(value);
  return str.length > max ? str.slice(0, max) : str;
};

export function auditoriaMiddleware(req, res, next) {
  req.registrarAuditoria = async ({
    tabla,
    registroId,
    accion,
    valoresAnteriores = null,
    valoresNuevos = null,
    cambios = null,
    descripcion = null,
    metadatos = null,
  }) => {
    if (!tabla || !registroId || !accion) {
      throw new Error('tabla, registroId y accion son requeridos para registrar auditoría');
    }

    const payload = {
      tabla,
      registro_id: String(registroId),
      accion,
      usuario_id: req.user?.id ?? null,
      usuario_nombre: req.user?.nombre ?? null,
      usuario_email: req.user?.email ?? null,
      valores_anteriores: valoresAnteriores,
      valores_nuevos: valoresNuevos,
      cambios: cambios || computeDiff(valoresAnteriores, valoresNuevos),
      metadatos: {
        ...metadatos,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
        endpoint: req.originalUrl || req.url,
        metodo_http: req.method,
      },
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null,
      endpoint: req.originalUrl || req.url,
      metodo_http: req.method,
      descripcion,
      fecha_cambio: new Date(),
    };

    payload.tabla = truncate(payload.tabla, 120);
    payload.registro_id = truncate(payload.registro_id, 120);
    payload.accion = truncate(payload.accion, 60);
    payload.usuario_nombre = truncate(payload.usuario_nombre, 150);
    payload.usuario_email = truncate(payload.usuario_email, 180);
    payload.ip = truncate(payload.ip, 45);
    payload.endpoint = truncate(payload.endpoint, 255);
    payload.metodo_http = truncate(payload.metodo_http, 16);

    if (payload.metadatos) {
      payload.metadatos = {
        ...payload.metadatos,
        endpoint: truncate(payload.metadatos.endpoint, 255),
      };
    }

    await Auditoria.create(payload);
  };

  return next();
}
