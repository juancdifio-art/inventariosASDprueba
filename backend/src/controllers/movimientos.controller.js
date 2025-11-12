import { Op, fn, col } from 'sequelize';
import { writeToString } from '@fast-csv/format';
import ExcelJS from 'exceljs';
import { sequelize } from '../config/database.js';
import { Movimiento, Producto } from '../models/index.js';

const MOVEMENT_TYPES = new Set(['entrada', 'salida', 'ajuste', 'transferencia_entrada', 'transferencia_salida']);
const MOVEMENT_INCLUDE = [{ model: Producto, as: 'Producto', attributes: ['id', 'nombre', 'codigo'] }];

const computeStockAfterMovement = (previous, type, quantity) => {
  switch (type) {
    case 'entrada':
    case 'transferencia_entrada':
      return previous + quantity;
    case 'salida':
    case 'transferencia_salida':
      return previous - quantity;
    case 'ajuste':
      return quantity;
    default:
      return previous;
  }
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const applyMovement = async ({
  producto_id,
  tipo,
  cantidad,
  motivo = null,
  referencia = null,
  costo_unitario = null,
}, transaction) => {
  if (!producto_id || !tipo || typeof cantidad === 'undefined') {
    throw new Error('producto_id, tipo y cantidad son requeridos');
  }

  if (!MOVEMENT_TYPES.has(tipo)) {
    throw new Error('tipo inválido');
  }

  const prod = await Producto.findByPk(producto_id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!prod) {
    throw new Error('Producto no encontrado');
  }

  const qty = Number(cantidad);
  if (Number.isNaN(qty) || qty <= 0) {
    throw new Error('cantidad debe ser un número positivo');
  }

  const previousStock = Number(prod.stock_actual ?? 0);
  const newStock = computeStockAfterMovement(previousStock, tipo, qty);
  if (newStock < 0) {
    throw new Error('Stock no puede quedar negativo');
  }

  let normalizedUnitCost = normalizeNumber(costo_unitario);
  if (normalizedUnitCost === null && (tipo === 'salida' || tipo === 'transferencia_salida')) {
    normalizedUnitCost = Number(prod.precio ?? 0);
  }
  const costoTotal = normalizedUnitCost !== null ? Number((normalizedUnitCost * qty).toFixed(2)) : null;

  await prod.update({ stock_actual: newStock }, { transaction });

  const movimiento = await Movimiento.create({
    producto_id,
    tipo,
    cantidad: qty,
    stock_anterior: previousStock,
    stock_nuevo: newStock,
    costo_unitario: normalizedUnitCost,
    costo_total: costoTotal,
    motivo,
    referencia,
    activo: true,
  }, { transaction });

  return { movimiento, nuevoStock: newStock };
};

const sanitizeDate = (value, { startOfDay = false, endOfDay = false } = {}) => {
  if (!value) return null;
  const isDateOnlyString = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

  let parsed;
  if (isDateOnlyString) {
    const [year, month, day] = value.split('-').map(Number);
    parsed = new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0);
  } else {
    parsed = new Date(value);
  }

  if (Number.isNaN(parsed.getTime())) return null;

  if (startOfDay) {
    parsed.setHours(0, 0, 0, 0);
  }

  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  }

  return parsed;
};

const buildMovementFilters = (query = {}) => {
  const {
    tipo,
    producto_id,
    productoId,
    fecha_desde,
    fecha_hasta,
    desde,
    hasta,
    numero_documento,
    search,
  } = query;

  const conditions = [];

  if (tipo && MOVEMENT_TYPES.has(tipo)) {
    conditions.push({ tipo });
  }

  const product = Number(producto_id ?? productoId);
  if (!Number.isNaN(product) && product > 0) {
    conditions.push({ producto_id: product });
  }

  const rawStartDate = fecha_desde ?? desde;
  const rawEndDate = fecha_hasta ?? hasta;
  const startDate = sanitizeDate(rawStartDate, { startOfDay: true });
  const endDate = sanitizeDate(rawEndDate, { endOfDay: true });
  if (startDate || endDate) {
    const dateCondition = {};
    if (startDate) dateCondition[Op.gte] = startDate;
    if (endDate) dateCondition[Op.lte] = endDate;
    conditions.push({ created_at: dateCondition });
  }

  const numeroDoc = typeof numero_documento === 'string' ? numero_documento.trim() : '';
  if (numeroDoc) {
    conditions.push({ referencia: { [Op.iLike]: `%${numeroDoc}%` } });
  }

  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    const likeValue = `%${term}%`;
    conditions.push({
      [Op.or]: [
        { referencia: { [Op.iLike]: likeValue } },
        { motivo: { [Op.iLike]: likeValue } },
      ],
    });
  }

  if (!conditions.length) {
    return {};
  }

  return { [Op.and]: conditions };
};

const mapMovementWithProduct = (movement) => {
  const plain = movement?.get ? movement.get({ plain: true }) : movement ?? {};
  const producto = plain.Producto ?? {};
  const mapped = {
    ...plain,
    producto_nombre: plain.producto_nombre ?? producto?.nombre ?? null,
    producto_codigo: plain.producto_codigo ?? producto?.codigo ?? null,
  };
  delete mapped.Producto;
  return mapped;
};

const serializeMovementForExport = (movement) => ({
  ID: movement.id,
  Producto: movement.producto_nombre ?? '',
  Codigo: movement.producto_codigo ?? '',
  Tipo: movement.tipo,
  Cantidad: Number(movement.cantidad ?? 0),
  StockAnterior: Number(movement.stock_anterior ?? 0),
  StockNuevo: Number(movement.stock_nuevo ?? 0),
  CostoUnitario: movement.costo_unitario != null ? Number(movement.costo_unitario) : '',
  CostoTotal: movement.costo_total != null ? Number(movement.costo_total) : '',
  Motivo: movement.motivo ?? '',
  Referencia: movement.referencia ?? '',
  Fecha: movement.created_at ? new Date(movement.created_at).toISOString() : '',
});

export const recordMovement = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await applyMovement(req.body ?? {}, transaction);
    await transaction.commit();
    return res.status(201).json({ success: true, message: 'Movimiento registrado', data: result });
  } catch (err) {
    await transaction.rollback();
    const status = err.message === 'Producto no encontrado' ? 404 : err.message.includes('inválido') || err.message.includes('positivo') || err.message.includes('negativo') ? 400 : 500;
    return res.status(status).json({ success: false, message: err.message, error: { type: status === 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR' } });
  }
};

export const bulkMovements = async (req, res) => {
  const { movimientos } = req.body || {};
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return res.status(400).json({ success: false, message: 'movimientos debe ser un arreglo con al menos un elemento' });
  }

  const transaction = await sequelize.transaction();
  try {
    const resultados = [];
    for (const movimiento of movimientos) {
      const resultado = await applyMovement(movimiento, transaction);
      resultados.push(resultado);
    }
    await transaction.commit();
    return res.status(201).json({ success: true, message: 'Movimientos registrados correctamente', data: resultados });
  } catch (err) {
    await transaction.rollback();
    const status = err.message === 'Producto no encontrado' ? 404 : err.message.includes('inválido') || err.message.includes('positivo') || err.message.includes('negativo') ? 400 : 500;
    return res.status(status).json({ success: false, message: err.message, error: { type: status === 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR' } });
  }
};

export const getMovements = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const offset = (page - 1) * limit;

    const where = buildMovementFilters(req.query);

    const { rows, count } = await Movimiento.findAndCountAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
      include: MOVEMENT_INCLUDE,
    });

    const items = rows.map(mapMovementWithProduct);

    return res.json({ success: true, data: { items, total: count, page, limit } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al listar movimientos', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const getMovementById = async (req, res) => {
  try {
    const movement = await Movimiento.findByPk(req.params.id, { include: MOVEMENT_INCLUDE });
    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }
    return res.json({ success: true, data: mapMovementWithProduct(movement) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener movimiento', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const getByProduct = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const offset = (page - 1) * limit;

    const { rows, count } = await Movimiento.findAndCountAll({
      where: { producto_id: Number(req.params.id) },
      offset,
      limit,
      order: [['created_at', 'DESC']],
      include: MOVEMENT_INCLUDE,
    });

    const items = rows.map(mapMovementWithProduct);
    return res.json({ success: true, data: { items, total: count, page, limit } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al listar por producto', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const getMovementsSummary = async (req, res) => {
  try {
    const where = buildMovementFilters(req.query);

    const totals = await Movimiento.findAll({
      where,
      attributes: [
        'tipo',
        [fn('COUNT', col('id')), 'movimientos'],
        [fn('SUM', col('cantidad')), 'cantidad_total'],
        [fn('SUM', col('costo_total')), 'costo_total'],
      ],
      group: ['tipo'],
      order: [['tipo', 'ASC']],
    });

    const totalMovimientos = totals.reduce((acc, item) => acc + Number(item.get('movimientos') || 0), 0);
    const totalCantidad = totals.reduce((acc, item) => acc + Number(item.get('cantidad_total') || 0), 0);
    const totalCosto = totals.reduce((acc, item) => acc + Number(item.get('costo_total') || 0), 0);

    return res.json({
      success: true,
      data: {
        items: totals.map((item) => item.get({ plain: true })),
        resumen: {
          totalMovimientos,
          totalCantidad,
          totalCosto,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener resumen de movimientos', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const exportMovementsCSV = async (req, res) => {
  try {
    const where = buildMovementFilters(req.query);
    const rows = await Movimiento.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: MOVEMENT_INCLUDE,
    });

    const data = rows.map(mapMovementWithProduct).map(serializeMovementForExport);

    const csv = await writeToString(data, {
      headers: true,
      writeBOM: true,
      delimiter: ';',
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="movimientos_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al exportar movimientos (CSV)', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const exportMovementsExcel = async (req, res) => {
  try {
    const where = buildMovementFilters(req.query);
    const rows = await Movimiento.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: MOVEMENT_INCLUDE,
    });

    const enriched = rows.map(mapMovementWithProduct);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Movimientos');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Producto', key: 'producto', width: 30 },
      { header: 'Código', key: 'codigo', width: 18 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Stock Anterior', key: 'stock_anterior', width: 16 },
      { header: 'Stock Nuevo', key: 'stock_nuevo', width: 16 },
      { header: 'Costo Unitario', key: 'costo_unitario', width: 16 },
      { header: 'Costo Total', key: 'costo_total', width: 16 },
      { header: 'Motivo', key: 'motivo', width: 25 },
      { header: 'Referencia', key: 'referencia', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 24 },
    ];

    enriched.forEach((movement) => {
      sheet.addRow({
        id: movement.id,
        producto: movement.producto_nombre ?? '',
        codigo: movement.producto_codigo ?? '',
        tipo: movement.tipo,
        cantidad: Number(movement.cantidad ?? 0),
        stock_anterior: Number(movement.stock_anterior ?? 0),
        stock_nuevo: Number(movement.stock_nuevo ?? 0),
        costo_unitario: movement.costo_unitario != null ? Number(movement.costo_unitario) : '',
        costo_total: movement.costo_total != null ? Number(movement.costo_total) : '',
        motivo: movement.motivo ?? '',
        referencia: movement.referencia ?? '',
        fecha: movement.created_at ? new Date(movement.created_at).toISOString() : '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="movimientos_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    return res.status(200).end();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al exportar movimientos (Excel)', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};
