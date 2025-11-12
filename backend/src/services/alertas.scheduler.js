import { Op, col, where as sequelizeWhere } from 'sequelize';
import logger from '../utils/logger.js';
import { Alerta, Producto } from '../models/index.js';

const DEFAULT_INTERVAL_MS = Number(process.env.ALERT_CHECK_INTERVAL_MS ?? 5 * 60 * 1000);
const FALLBACK_LOW_STOCK_THRESHOLD = Number(process.env.ALERT_LOW_STOCK_THRESHOLD ?? 5);

let schedulerId = null;
let isProcessing = false;

const hasActiveAlert = async (productoId, tipo) => {
  const existing = await Alerta.findOne({
    where: {
      producto_id: productoId,
      tipo,
      estado: 'activa',
    },
  });
  return Boolean(existing);
};

const resolveStockAlertsIfRecovered = async (producto, stockActual, stockMinimo) => {
  const alerts = await Alerta.findAll({
    where: {
      producto_id: producto.id,
      estado: 'activa',
      tipo: { [Op.in]: ['stock_minimo', 'stock_critico'] },
    },
  });

  if (!alerts.length) return;

  if (stockActual > 0 && stockMinimo > 0 && stockActual > stockMinimo) {
    for (const alert of alerts) {
      await alert.update({ estado: 'resuelta', fecha_resolucion: new Date() });
      logger.info('alertas.auto.resolved', { alerta_id: alert.id, producto_id: producto.id, motivo: 'stock_supera_minimo' });
    }
  } else if (stockActual > 0 && stockMinimo <= 0 && stockActual > FALLBACK_LOW_STOCK_THRESHOLD) {
    for (const alert of alerts) {
      await alert.update({ estado: 'resuelta', fecha_resolucion: new Date() });
      logger.info('alertas.auto.resolved', { alerta_id: alert.id, producto_id: producto.id, motivo: 'stock_supera_fallback' });
    }
  } else if (stockActual > 0 && alerts.some((alert) => alert.tipo === 'stock_critico')) {
    for (const alert of alerts) {
      await alert.update({ estado: 'resuelta', fecha_resolucion: new Date() });
      logger.info('alertas.auto.resolved', { alerta_id: alert.id, producto_id: producto.id, motivo: 'stock_deja_cero' });
    }
  }
};

const registerStockAlert = async ({ producto, tipo, prioridad, titulo, descripcion, metadata }) => {
  if (await hasActiveAlert(producto.id, tipo)) {
    return null;
  }

  const alert = await Alerta.create({
    producto_id: producto.id,
    titulo,
    descripcion,
    tipo,
    prioridad,
    estado: 'activa',
    metadata: metadata ?? null,
  });

  logger.info('alertas.auto.created', { tipo, producto_id: producto.id });
  return alert;
};

const buildAlertForProduct = (producto) => {
  const stockActual = Number(producto.stock_actual ?? 0);
  const stockMinimo = Number(producto.stock_minimo ?? 0);

  if (stockActual <= 0) {
    return {
      tipo: 'stock_critico',
      prioridad: 'alta',
      titulo: `Sin stock: ${producto.nombre}`,
      descripcion: `El producto ${producto.nombre} no tiene stock disponible`,
    };
  }

  if (stockMinimo > 0 && stockActual <= stockMinimo) {
    return {
      tipo: 'stock_minimo',
      prioridad: 'media',
      titulo: `Stock mínimo alcanzado: ${producto.nombre}`,
      descripcion: `El stock (${stockActual}) está en o por debajo del mínimo (${stockMinimo})`,
    };
  }

  if (stockMinimo === 0 && stockActual > 0 && stockActual <= FALLBACK_LOW_STOCK_THRESHOLD) {
    return {
      tipo: 'stock_minimo',
      prioridad: 'media',
      titulo: `Stock bajo: ${producto.nombre}`,
      descripcion: `El stock (${stockActual}) está por debajo del umbral general (${FALLBACK_LOW_STOCK_THRESHOLD})`,
    };
  }

  return null;
};

const fetchProductsNeedingAlerts = async () => {
  const lowStockCondition = {
    [Op.and]: [
      { stock_minimo: { [Op.gt]: 0 } },
      sequelizeWhere(col('Producto.stock_actual'), { [Op.lte]: col('Producto.stock_minimo') }),
    ],
  };

  const fallbackLowStockCondition = {
    stock_minimo: 0,
    stock_actual: { [Op.lte]: FALLBACK_LOW_STOCK_THRESHOLD },
  };

  const zeroStockCondition = {
    stock_actual: { [Op.lte]: 0 },
  };

  return Producto.findAll({
    where: {
      activo: true,
      [Op.or]: [zeroStockCondition, lowStockCondition, fallbackLowStockCondition],
    },
    attributes: ['id', 'nombre', 'codigo', 'stock_actual', 'stock_minimo'],
  });
};

const processProduct = async (producto) => {
  const stockActual = Number(producto.stock_actual ?? 0);
  const stockMinimo = Number(producto.stock_minimo ?? 0);

  await resolveStockAlertsIfRecovered(producto, stockActual, stockMinimo);

  const alertData = buildAlertForProduct(producto);
  if (!alertData) return;

  await registerStockAlert({
    producto,
    ...alertData,
    metadata: {
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      source: 'auto_stock',
    },
  });
};

const fetchProductsWithActiveAlerts = async () => {
  const alertRows = await Alerta.findAll({
    where: {
      estado: 'activa',
      tipo: { [Op.in]: ['stock_minimo', 'stock_critico'] },
    },
    attributes: ['producto_id'],
    group: ['producto_id'],
    raw: true,
  });

  const productIds = alertRows.map((row) => row.producto_id).filter(Boolean);
  if (!productIds.length) return [];

  return Producto.findAll({
    where: { id: productIds },
    attributes: ['id', 'nombre', 'codigo', 'stock_actual', 'stock_minimo'],
  });
};

export const processStockAlerts = async () => {
  if (isProcessing) return;
  isProcessing = true;
  try {
    const [productosNecesitanAlertas, productosConAlertas] = await Promise.all([
      fetchProductsNeedingAlerts(),
      fetchProductsWithActiveAlerts(),
    ]);

    const productosMap = new Map();
    const addProductos = (items) => {
      for (const producto of items) {
        productosMap.set(producto.id, producto);
      }
    };

    addProductos(productosNecesitanAlertas);
    addProductos(productosConAlertas);

    for (const producto of productosMap.values()) {
      try {
        await processProduct(producto);
      } catch (error) {
        logger.error('alertas.auto.product_error', { producto_id: producto.id, error: error.message });
      }
    }
  } catch (error) {
    logger.error('alertas.auto.general_error', { error: error.message });
  } finally {
    isProcessing = false;
  }
};

export const startAlertScheduler = () => {
  if (schedulerId) {
    return;
  }
  logger.info('alertas.auto.scheduler_start', { intervalMs: DEFAULT_INTERVAL_MS });
  schedulerId = setInterval(processStockAlerts, DEFAULT_INTERVAL_MS);
  processStockAlerts().catch((error) => logger.error('alertas.auto.initial_error', { error: error.message }));
};

export const stopAlertScheduler = () => {
  if (schedulerId) {
    clearInterval(schedulerId);
    schedulerId = null;
  }
};
