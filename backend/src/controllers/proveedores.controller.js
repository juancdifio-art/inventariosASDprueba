import { Op } from 'sequelize';
import { Proveedor } from '../models/index.js';
import { sequelize } from '../config/database.js';
import logger from '../utils/logger.js';

const ensureProveedorSequence = async () => {
  await sequelize.query(
    "SELECT setval('proveedores_id_seq', COALESCE((SELECT MAX(id) FROM proveedores), 0) + 1, false)"
  );
};

const toNullableTrimmed = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const parseIntegerNullable = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseDecimalNullable = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const sanitizeProveedorPayload = (payload) => {
  const {
    nombre,
    cuit,
    email,
    telefono,
    celular,
    direccion,
    ciudad,
    provincia,
    pais,
    codigo_postal,
    sitio_web,
    contacto,
    cargo_contacto,
    email_contacto,
    condicion_pago,
    dias_entrega,
    rubro,
    logistica,
    logistica_contacto,
    rating,
    monto_minimo,
    notas,
    activo,
  } = payload;

  const trimmedNombre = toNullableTrimmed(nombre);

  const sanitized = {
    nombre: trimmedNombre,
    cuit: toNullableTrimmed(cuit),
    email: toNullableTrimmed(email),
    telefono: toNullableTrimmed(telefono),
    celular: toNullableTrimmed(celular),
    direccion: toNullableTrimmed(direccion),
    ciudad: toNullableTrimmed(ciudad),
    provincia: toNullableTrimmed(provincia),
    pais: toNullableTrimmed(pais),
    codigo_postal: toNullableTrimmed(codigo_postal),
    sitio_web: toNullableTrimmed(sitio_web),
    contacto: toNullableTrimmed(contacto),
    cargo_contacto: toNullableTrimmed(cargo_contacto),
    email_contacto: toNullableTrimmed(email_contacto),
    condicion_pago: toNullableTrimmed(condicion_pago),
    dias_entrega: parseIntegerNullable(dias_entrega),
    rubro: toNullableTrimmed(rubro),
    logistica: toNullableTrimmed(logistica),
    logistica_contacto: toNullableTrimmed(logistica_contacto),
    rating: toNullableTrimmed(rating),
    monto_minimo: parseDecimalNullable(monto_minimo),
    notas: toNullableTrimmed(notas),
  };

  if (typeof activo !== 'undefined') {
    sanitized.activo = Boolean(activo);
  }

  return sanitized;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9()+\-\s]{6,20}$/;

const validateProveedorPayload = (payload) => {
  const errors = [];

  if (!payload.nombre) {
    errors.push('Nombre es requerido');
  }

  const emailFields = [
    { value: payload.email, label: 'Email' },
    { value: payload.email_contacto, label: 'Email contacto' },
  ];

  emailFields.forEach(({ value, label }) => {
    if (value && !EMAIL_REGEX.test(value)) {
      errors.push(`${label} no es válido`);
    }
  });

  const phoneFields = [
    { value: payload.telefono, label: 'Teléfono' },
    { value: payload.celular, label: 'Celular / WhatsApp' },
    { value: payload.logistica_contacto, label: 'Teléfono transporte' },
  ];

  phoneFields.forEach(({ value, label }) => {
    if (value && !PHONE_REGEX.test(value)) {
      errors.push(`${label} debe tener entre 6 y 20 caracteres numéricos`);
    }
  });

  return errors;
};

export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;
    const { rows, count } = await Proveedor.findAndCountAll({
      offset,
      limit: parsedLimit,
      order: [['id', 'ASC']]
    });
    logger.info('proveedores.list.success', {
      count,
      page: parsedPage,
      limit: parsedLimit,
    });
    return res.json({ success: true, data: { items: rows, total: count, page: parsedPage, limit: parsedLimit } });
  } catch (err) {
    logger.error('proveedores.list.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al listar proveedores', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const search = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;
    const where = search
      ? {
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { telefono: { [Op.iLike]: `%${search}%` } },
            { direccion: { [Op.iLike]: `%${search}%` } }
          ]
        }
      : {};
    const { rows, count } = await Proveedor.findAndCountAll({ where, offset, limit: parsedLimit, order: [['id', 'ASC']] });
    logger.info('proveedores.search.success', {
      count,
      page: parsedPage,
      limit: parsedLimit,
      hasSearch: Boolean(search),
    });
    return res.json({ success: true, data: { items: rows, total: count, page: parsedPage, limit: parsedLimit } });
  } catch (err) {
    logger.error('proveedores.search.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error en búsqueda de proveedores', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await Proveedor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    logger.info('proveedores.get.success', { id: req.params.id });
    return res.json({ success: true, data: item });
  } catch (err) {
    logger.error('proveedores.get.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({ success: false, message: 'Error al obtener proveedor', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const create = async (req, res) => {
  try {
    const sanitized = sanitizeProveedorPayload(req.body);
    const validationErrors = validateProveedorPayload(sanitized);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        error: { type: 'VALIDATION_ERROR', details: validationErrors },
      });
    }
    await ensureProveedorSequence();
    if (typeof sanitized.activo === 'undefined') sanitized.activo = true;
    const item = await Proveedor.create(sanitized);
    await req.registrarAuditoria?.({
      tabla: 'proveedores',
      registroId: item.id,
      accion: 'CREATE',
      valoresAnteriores: null,
      valoresNuevos: item.get({ plain: true }),
      descripcion: `Creación de proveedor ${item.nombre}`,
    });
    logger.info('proveedores.create.success', { id: item.id });
    return res.status(201).json({ success: true, message: 'Proveedor creado', data: item });
  } catch (err) {
    logger.error('proveedores.create.error', { message: err.message, stack: err.stack, body: req.body });
    return res.status(500).json({ success: false, message: 'Error al crear proveedor', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const update = async (req, res) => {
  try {
    const sanitized = sanitizeProveedorPayload(req.body);
    const item = await Proveedor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    const previousValues = item.get({ plain: true });
    const validationErrors = validateProveedorPayload(sanitized);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        error: { type: 'VALIDATION_ERROR', details: validationErrors },
      });
    }
    await item.update(sanitized);
    await req.registrarAuditoria?.({
      tabla: 'proveedores',
      registroId: item.id,
      accion: 'UPDATE',
      valoresAnteriores: previousValues,
      valoresNuevos: item.get({ plain: true }),
      descripcion: `Actualización de proveedor ${item.nombre}`,
    });
    logger.info('proveedores.update.success', { id: item.id });
    return res.json({ success: true, message: 'Proveedor actualizado', data: item });
  } catch (err) {
    logger.error('proveedores.update.error', { message: err.message, stack: err.stack, params: req.params, body: req.body });
    return res.status(500).json({ success: false, message: 'Error al actualizar proveedor', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const remove = async (req, res) => {
  try {
    const item = await Proveedor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    const previousValues = item.get({ plain: true });
    await item.destroy();
    await req.registrarAuditoria?.({
      tabla: 'proveedores',
      registroId: previousValues.id,
      accion: 'DELETE',
      valoresAnteriores: previousValues,
      valoresNuevos: null,
      descripcion: `Eliminación de proveedor ${previousValues.nombre}`,
    });
    logger.info('proveedores.remove.success', { id: req.params.id });
    return res.json({ success: true, message: 'Proveedor eliminado' });
  } catch (err) {
    logger.error('proveedores.remove.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({ success: false, message: 'Error al eliminar proveedor', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};
