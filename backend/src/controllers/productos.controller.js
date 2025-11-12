import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Producto, Movimiento } from '../models/index.js';
import logger from '../utils/logger.js';
import { sanitizeProductoPayload, validateProductoPayload } from '../validators/productos.validator.js';

const ensureMovimientoSequence = async (transaction) => {
  if (sequelize.getDialect() !== 'postgres') return;
  try {
    await sequelize.query(
      "SELECT setval('movimientos_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM movimientos), 0), 1))",
      { transaction }
    );
  } catch (error) {
    logger.warn('products.ensureMovimientoSequence.warn', { message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      categoria_id,
      proveedor_id,
      activo,
      min_stock,
      max_stock,
      min_price,
      max_price,
      sort_by = 'id',
      sort_dir = 'asc',
    } = req.query;

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { codigo: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (categoria_id) where.categoria_id = Number(categoria_id);
    if (proveedor_id) where.proveedor_id = Number(proveedor_id);
    if (typeof activo !== 'undefined') where.activo = String(activo) === 'true';

    const buildNumber = (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const minStockValue = buildNumber(min_stock);
    const maxStockValue = buildNumber(max_stock);
    if (minStockValue !== undefined || maxStockValue !== undefined) {
      where.stock_actual = { ...where.stock_actual };
      if (minStockValue !== undefined) where.stock_actual[Op.gte] = minStockValue;
      if (maxStockValue !== undefined) where.stock_actual[Op.lte] = maxStockValue;
    }

    const minPriceValue = buildNumber(min_price);
    const maxPriceValue = buildNumber(max_price);
    if (minPriceValue !== undefined || maxPriceValue !== undefined) {
      where.precio = { ...where.precio };
      if (minPriceValue !== undefined) where.precio[Op.gte] = minPriceValue;
      if (maxPriceValue !== undefined) where.precio[Op.lte] = maxPriceValue;
    }

    const sortableFields = new Set(['id', 'nombre', 'codigo', 'stock_actual', 'precio', 'createdAt', 'updatedAt']);
    const sortField = sortableFields.has(sort_by) ? sort_by : 'id';
    const sortDirection = String(sort_dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { rows, count } = await Producto.findAndCountAll({
      where,
      offset,
      limit: parsedLimit,
      order: [[sortField, sortDirection]],
    });
    logger.info('products.list.success', {
      count,
      page: parsedPage,
      limit: parsedLimit,
      sortField,
      sortDirection,
      filters: {
        hasSearch: Boolean(search),
        categoriaId: categoria_id ? Number(categoria_id) : null,
        proveedorId: proveedor_id ? Number(proveedor_id) : null,
        stockRange: { min: minStockValue ?? null, max: maxStockValue ?? null },
        priceRange: { min: minPriceValue ?? null, max: maxPriceValue ?? null },
        activo: typeof activo !== 'undefined' ? String(activo) : null,
      },
    });
    return res.json({ success: true, data: { items: rows, total: count, page: parsedPage, limit: parsedLimit } });
  } catch (err) {
    logger.error('products.list.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al listar productos', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const getByCategoria = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const categoria_id = Number(req.params.id);
    const { rows, count } = await Producto.findAndCountAll({
      where: { categoria_id },
      offset,
      limit: Number(limit),
      order: [['id', 'ASC']]
    });
    return res.json({ success: true, data: { items: rows, total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al listar por categoría', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await Producto.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener producto', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const create = async (req, res) => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'gerente') {
    logger.warn('products.create.forbidden', { userId: req.user?.id ?? null, rol: req.user?.rol ?? null });
    return res.status(403).json({ success: false, message: 'Permisos insuficientes' });
  }
  try {
    const sanitized = sanitizeProductoPayload(req.body);
    const validationErrors = validateProductoPayload(sanitized);
    if (validationErrors.length) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', error: { type: 'VALIDATION_ERROR', details: validationErrors } });
    }

    const trimmedCodigo = sanitized.codigo;
    const trimmedNombre = sanitized.nombre;

    const exists = await Producto.findOne({ where: { codigo: trimmedCodigo } });
    if (exists) return res.status(400).json({ success: false, message: 'codigo ya existente' });

    const parsedCategoriaId = sanitized.categoria_id ?? null;
    const parsedProveedorId = sanitized.proveedor_id ?? null;

    const item = await Producto.create({
      codigo: trimmedCodigo,
      nombre: trimmedNombre,
      descripcion: sanitized.descripcion ?? null,
      categoria_id: parsedCategoriaId,
      proveedor_id: parsedProveedorId,
      stock_actual: sanitized.stock_actual,
      stock_minimo: sanitized.stock_minimo,
      precio: sanitized.precio,
      atributos_personalizados: sanitized.atributos_personalizados,
      activo: sanitized.activo,
    });
    await req.registrarAuditoria?.({
      tabla: 'productos',
      registroId: item.id,
      accion: 'CREATE',
      valoresAnteriores: null,
      valoresNuevos: item.get({ plain: true }),
      descripcion: `Creación de producto ${item.nombre}`,
    });
    return res.status(201).json({ success: true, message: 'Producto creado', data: item });
  } catch (err) {
    logger.error('products.create.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al crear producto', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const update = async (req, res) => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'gerente') {
    logger.warn('products.update.forbidden', { userId: req.user?.id ?? null, rol: req.user?.rol ?? null });
    return res.status(403).json({ success: false, message: 'Permisos insuficientes' });
  }
  const t = await sequelize.transaction();
  try {
    const sanitized = sanitizeProductoPayload(req.body, { partial: true });
    const validationErrors = validateProductoPayload(sanitized, { partial: true });
    if (validationErrors.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Datos inválidos', error: { type: 'VALIDATION_ERROR', details: validationErrors } });
    }
    const item = await Producto.findByPk(req.params.id, { transaction: t });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    if (Object.prototype.hasOwnProperty.call(sanitized, 'codigo') && sanitized.codigo && sanitized.codigo !== item.codigo) {
      const exists = await Producto.findOne({ where: { codigo: sanitized.codigo }, transaction: t });
      if (exists) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'codigo ya existente' });
      }
    }

    const previousStock = Number(item.stock_actual ?? 0);
    const hasStockUpdate = Object.prototype.hasOwnProperty.call(sanitized, 'stock_actual');
    const hasStockMinimoUpdate = Object.prototype.hasOwnProperty.call(sanitized, 'stock_minimo');
    let newStockValue = previousStock;
    let newStockMinimoValue = Number(item.stock_minimo ?? 0);
    if (hasStockUpdate) {
      newStockValue = sanitized.stock_actual;
    }

    if (hasStockMinimoUpdate) {
      newStockMinimoValue = sanitized.stock_minimo;
    }

    const updatePayload = {};
    ['codigo', 'nombre', 'descripcion', 'categoria_id', 'proveedor_id', 'stock_actual', 'stock_minimo', 'precio', 'atributos_personalizados', 'activo'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(sanitized, field)) {
        updatePayload[field] = sanitized[field];
      }
    });

    const previousValues = item.get({ plain: true });

    await item.update(updatePayload, { transaction: t });

    if (hasStockUpdate && newStockValue !== previousStock) {
      const diff = newStockValue - previousStock;
      await ensureMovimientoSequence(t);
      await Movimiento.create(
        {
          producto_id: item.id,
          tipo: 'ajuste',
          cantidad: diff,
          stock_anterior: previousStock,
          stock_nuevo: newStockValue,
          motivo: 'Ajuste manual desde edición de producto',
          referencia: 'productos.update',
          activo: true,
        },
        { transaction: t }
      );
    }

    await item.reload({ transaction: t });
    await t.commit();
    await req.registrarAuditoria?.({
      tabla: 'productos',
      registroId: item.id,
      accion: 'UPDATE',
      valoresAnteriores: previousValues,
      valoresNuevos: item.get({ plain: true }),
      descripcion: `Actualización de producto ${item.nombre}`,
    });
    return res.json({ success: true, message: 'Producto actualizado', data: item });
  } catch (err) {
    await t.rollback();
    logger.error('products.update.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al actualizar producto', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const remove = async (req, res) => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'gerente') {
    logger.warn('products.delete.forbidden', { userId: req.user?.id ?? null, rol: req.user?.rol ?? null });
    return res.status(403).json({ success: false, message: 'Permisos insuficientes' });
  }
  try {
    const item = await Producto.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    const previousValues = item.get({ plain: true });
    await item.destroy();
    await req.registrarAuditoria?.({
      tabla: 'productos',
      registroId: previousValues.id,
      accion: 'DELETE',
      valoresAnteriores: previousValues,
      valoresNuevos: null,
      descripcion: `Eliminación de producto ${previousValues.nombre}`,
    });
    return res.json({ success: true, message: 'Producto eliminado' });
  } catch (err) {
    logger.error('products.delete.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al eliminar producto', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};
