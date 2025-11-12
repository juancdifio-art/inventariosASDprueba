import { Op, col, where as sequelizeWhere } from 'sequelize';
import { Categoria, Proveedor, Producto, Movimiento } from '../models/index.js';
import logger from '../utils/logger.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'si', 'sí', 'on'].includes(normalized);
  }
  return false;
};

export const summary = async (req, res) => {
  try {
    const lowStockThreshold = Number(req.query.lowStock || 5);
    const recentProductsLimit = Number(req.query.recentProducts || 5);
    const recentMovementsParam = req.query.recentMovements;
    const parsedRecentMovements = Number(recentMovementsParam);
    const hasRecentMovementsLimit =
      recentMovementsParam !== undefined && recentMovementsParam !== null && recentMovementsParam !== '';
    const recentMovementsLimit =
      hasRecentMovementsLimit && Number.isFinite(parsedRecentMovements) && parsedRecentMovements > 0
        ? parsedRecentMovements
        : null;
    const rawPeriodDays = Number(req.query.periodDays);
    const periodDays = Number.isFinite(rawPeriodDays) && rawPeriodDays > 0 ? Math.min(Math.floor(rawPeriodDays), 120) : 30;
    const includePreviousPeriod = parseBoolean(
      req.query.includePreviousPeriod ?? req.query.includePrevious ?? false
    );
    const nowDate = new Date();
    const currentPeriodEnd = nowDate;
    const currentPeriodStart = new Date(currentPeriodEnd.getTime() - periodDays * DAY_IN_MS);
    const previousPeriodEnd = currentPeriodStart;
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDays * DAY_IN_MS);

    const [
      totalProductos,
      totalProductosActivos,
      totalCategorias,
      totalCategoriasPrincipales,
      totalProveedores,
      totalProveedoresActivos,
      movimientosPeriodo,
      lowStockCount,
      lowStockItems,
      recentMovs,
      recentProducts,
    ] = await Promise.all([
      Producto.count(),
      Producto.count({ where: { activo: true } }),
      Categoria.count(),
      Categoria.count({ where: { padre_id: null } }),
      Proveedor.count(),
      Proveedor.count({ where: { activo: true } }),
      Movimiento.count({
        where: {
          activo: true,
          created_at: {
            [Op.gte]: currentPeriodStart,
            [Op.lt]: currentPeriodEnd,
          },
        },
      }),
      Producto.count({
        where: {
          activo: true,
          [Op.or]: [
            {
              [Op.and]: [
                { stock_minimo: { [Op.gt]: 0 } },
                sequelizeWhere(col('Producto.stock_actual'), { [Op.lte]: col('Producto.stock_minimo') }),
              ],
            },
            {
              stock_minimo: 0,
              stock_actual: { [Op.lte]: lowStockThreshold },
            },
          ],
        },
      }),
      Producto.findAll({
        where: {
          activo: true,
          [Op.or]: [
            {
              [Op.and]: [
                { stock_minimo: { [Op.gt]: 0 } },
                sequelizeWhere(col('Producto.stock_actual'), { [Op.lte]: col('Producto.stock_minimo') }),
              ],
            },
            {
              stock_minimo: 0,
              stock_actual: { [Op.lte]: lowStockThreshold },
            },
          ],
        },
        attributes: ['id', 'nombre', 'stock_actual', 'stock_minimo', 'categoria_id'],
        order: [['stock_actual', 'ASC']],
        limit: 10,
      }),
      Movimiento.findAll({
        where: {
          activo: true,
          created_at: {
            [Op.gte]: currentPeriodStart,
            [Op.lt]: currentPeriodEnd,
          },
        },
        order: [['created_at', 'DESC']],
        ...(recentMovementsLimit ? { limit: recentMovementsLimit } : {}),
        attributes: ['id', 'producto_id', 'tipo', 'cantidad', 'motivo', 'referencia', 'created_at'],
      }),
      Producto.findAll({
        where: { activo: true },
        attributes: ['id', 'nombre', 'categoria_id', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: recentProductsLimit,
      }),
    ]);

    const previousMovs = includePreviousPeriod
      ? await Movimiento.findAll({
          where: {
            activo: true,
            created_at: {
              [Op.gte]: previousPeriodStart,
              [Op.lt]: previousPeriodEnd,
            },
          },
          order: [['created_at', 'DESC']],
          ...(recentMovementsLimit ? { limit: recentMovementsLimit } : {}),
          attributes: ['id', 'producto_id', 'tipo', 'cantidad', 'motivo', 'referencia', 'created_at'],
        })
      : [];

    const lowStockList = Array.isArray(lowStockItems) ? lowStockItems : [];
    const categoriaIds = new Set();
    lowStockList.forEach((item) => {
      if (item.categoria_id) categoriaIds.add(item.categoria_id);
    });
    const recentProductsList = Array.isArray(recentProducts) ? recentProducts : [];
    recentProductsList.forEach((item) => {
      if (item.categoria_id) categoriaIds.add(item.categoria_id);
    });

    let categoriaMap = {};
    if (categoriaIds.size) {
      const categorias = await Categoria.findAll({
        where: { id: Array.from(categoriaIds) },
        attributes: ['id', 'nombre'],
      });
      categoriaMap = categorias.reduce((acc, cat) => {
        acc[cat.id] = cat.nombre;
        return acc;
      }, {});
    }

    return res.json({
      success: true,
      data: {
        totals: {
          productos: totalProductos,
          productos_activos: totalProductosActivos,
          categorias: totalCategorias,
          categorias_principales: totalCategoriasPrincipales,
          proveedores: totalProveedores,
          proveedores_activos: totalProveedoresActivos,
          movimientos_30d: movimientosPeriodo,
        },
        lowStock: {
          threshold: lowStockThreshold,
          count: typeof lowStockCount === 'number' ? lowStockCount : lowStockList.length,
          items: lowStockList.map((item) => ({
            ...item.get({ plain: true }),
            stock_actual: Number(item.stock_actual ?? 0),
            stock_minimo: Number(item.stock_minimo ?? 0),
            categoria_nombre: categoriaMap[item.categoria_id] ?? null,
          })),
        },
        recentMovements: recentMovs.map((mov) => ({
          ...mov.get({ plain: true }),
          cantidad: Number(mov.cantidad ?? 0),
        })),
        recentMovementsPrevious: previousMovs.map((mov) => ({
          ...mov.get({ plain: true }),
          cantidad: Number(mov.cantidad ?? 0),
        })),
        recentProducts: recentProductsList.map((product) => ({
          ...product.get({ plain: true }),
          categoria_nombre: categoriaMap[product.categoria_id] ?? null,
        })),
        period: {
          days: periodDays,
          current: {
            start: currentPeriodStart.toISOString(),
            end: currentPeriodEnd.toISOString(),
          },
          previous: includePreviousPeriod
            ? {
                start: previousPeriodStart.toISOString(),
                end: previousPeriodEnd.toISOString(),
              }
            : null,
        },
      }
    });
  } catch (err) {
    logger.error('dashboard.summary.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al obtener resumen', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};
