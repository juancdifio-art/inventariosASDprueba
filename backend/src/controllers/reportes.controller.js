import ExcelJS from 'exceljs';
import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import { sequelize, Producto, Categoria, Proveedor, Movimiento, Alerta } from '../models/index.js';

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const MOVEMENT_IN_TYPES = ['entrada', 'transferencia_entrada'];
const MOVEMENT_OUT_TYPES = ['salida', 'transferencia_salida'];

const toNumber = (value) => {
  const num = Number(value ?? 0);
  return Number.isNaN(num) ? 0 : num;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

const percentage = (current, previous) => {
  if (!previous || Number.isNaN(previous) || previous === 0) return null;
  const result = ((current - previous) / previous) * 100;
  return Number.isFinite(result) ? result : null;
};

const addDays = (date, days) => {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const setUtcStartOfDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const setUtcEndOfDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

const fetchInventoryData = async (query = {}) => {
  const whereClause = {};
  const { categoria_id, proveedor_id, activo } = query;

  if (typeof categoria_id !== 'undefined') {
    const parsedCategoriaId = Number.parseInt(categoria_id, 10);
    if (!Number.isNaN(parsedCategoriaId)) {
      whereClause.categoria_id = parsedCategoriaId;
    }
  }
  if (typeof proveedor_id !== 'undefined') {
    const parsedProveedorId = Number.parseInt(proveedor_id, 10);
    if (!Number.isNaN(parsedProveedorId)) {
      whereClause.proveedor_id = parsedProveedorId;
    }
  }
  if (typeof activo !== 'undefined') whereClause.activo = String(activo) === 'true';

  const productos = await Producto.findAll({
    where: whereClause,
    include: [
      { model: Categoria, as: 'Categoria', attributes: ['id', 'nombre'] },
      { model: Proveedor, as: 'Proveedor', attributes: ['id', 'nombre'] },
    ],
    order: [['nombre', 'ASC']],
  });

  const plain = productos.map((p) => p.get({ plain: true }));

  const resumen = plain.reduce((acc, item) => {
    const stock = Number(item.stock_actual ?? 0);
    const precio = Number(item.precio ?? 0);
    acc.totalProductos += 1;
    acc.stockTotal += stock;
    acc.valorTotal += stock * precio;
    if (stock <= Number(item.stock_minimo ?? 0)) acc.productosBajoStock += 1;
    return acc;
  }, { totalProductos: 0, stockTotal: 0, valorTotal: 0, productosBajoStock: 0 });

  return {
    resumen,
    items: plain.map((item) => ({
      ...item,
      categoria_nombre: item.Categoria?.nombre ?? null,
      proveedor_nombre: item.Proveedor?.nombre ?? null,
    })),
  };
};

export const inventoryReport = async (req, res) => {
  try {
    const data = await fetchInventoryData(req.query ?? {});
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al generar reporte de inventario', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

const fetchMovementData = async (query = {}) => {
  const { desde, hasta, agrupacion = 'dia', tipo } = query;
  const startDate = parseDate(desde);
  const endDate = parseDate(hasta);

  const whereClause = {};
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at[Op.gte] = startDate;
    if (endDate) whereClause.created_at[Op.lte] = endDate;
  }
  if (tipo && ['entrada', 'salida', 'ajuste', 'transferencia_entrada', 'transferencia_salida'].includes(tipo)) {
    whereClause.tipo = tipo;
  }

  const dialect = sequelize.getDialect();

  if (dialect === 'sqlite') {
    const sqliteFormat = {
      dia: '%Y-%m-%d',
      semana: '%Y-W%W',
      mes: '%Y-%m',
    }[agrupacion] || '%Y-%m-%d';

    return Movimiento.findAll({
      attributes: [
        [sequelize.fn('strftime', sqliteFormat, col('created_at')), 'periodo'],
        'tipo',
        [fn('COUNT', col('id')), 'movimientos'],
        [fn('SUM', col('cantidad')), 'cantidad_total'],
        [fn('SUM', col('costo_total')), 'costo_total'],
      ],
      where: whereClause,
      group: ['periodo', 'tipo'],
      order: [[literal('periodo'), 'ASC'], ['tipo', 'ASC']],
      raw: true,
    });
  }

  const formatByGrouping = {
    dia: 'YYYY-MM-DD',
    semana: 'IYYY-IW',
    mes: 'YYYY-MM',
  }[agrupacion] || 'YYYY-MM-DD';

  return Movimiento.findAll({
    attributes: [
      [fn('to_char', col('created_at'), formatByGrouping), 'periodo'],
      'tipo',
      [fn('COUNT', col('id')), 'movimientos'],
      [fn('SUM', col('cantidad')), 'cantidad_total'],
      [fn('SUM', col('costo_total')), 'costo_total'],
    ],
    where: whereClause,
    group: ['periodo', 'tipo'],
    order: [[literal('periodo'), 'ASC'], ['tipo', 'ASC']],
    raw: true,
  });
};

export const movementReport = async (req, res) => {
  try {
    const data = await fetchMovementData(req.query ?? {});
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al generar reporte de movimientos', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

const buildMovementWhere = (query = {}) => {
  const { desde, hasta, tipo } = query;
  const startDate = parseDate(desde);
  const endDate = parseDate(hasta);
  const whereClause = {};
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at[Op.gte] = startDate;
    if (endDate) whereClause.created_at[Op.lte] = endDate;
  }
  if (tipo && ['entrada', 'salida', 'ajuste', 'transferencia_entrada', 'transferencia_salida'].includes(tipo)) {
    whereClause.tipo = tipo;
  }
  return whereClause;
};

const fetchAlertData = async (query = {}) => {
  const { estado, prioridad, tipo, desde, hasta } = query;
  const whereClause = {};

  if (estado) whereClause.estado = estado;
  if (prioridad) whereClause.prioridad = prioridad;
  if (tipo) whereClause.tipo = tipo;

  const startDate = parseDate(desde);
  const endDate = parseDate(hasta);
  if (startDate || endDate) {
    whereClause.fecha_disparo = {};
    if (startDate) whereClause.fecha_disparo[Op.gte] = startDate;
    if (endDate) whereClause.fecha_disparo[Op.lte] = endDate;
  }

  const items = await Alerta.findAll({
    attributes: [
      'tipo',
      'prioridad',
      'estado',
      [fn('COUNT', col('id')), 'cantidad'],
    ],
    where: whereClause,
    group: ['tipo', 'prioridad', 'estado'],
    order: [['tipo', 'ASC'], ['prioridad', 'DESC']],
    raw: true,
  });

  const totales = await Alerta.count({ where: whereClause });
  return { totales, items };
};

const buildAlertWhere = (query = {}) => {
  const { estado, prioridad, tipo, desde, hasta } = query;
  const whereClause = {};
  if (estado) whereClause.estado = estado;
  if (prioridad) whereClause.prioridad = prioridad;
  if (tipo) whereClause.tipo = tipo;
  const startDate = parseDate(desde);
  const endDate = parseDate(hasta);
  if (startDate || endDate) {
    whereClause.fecha_disparo = {};
    if (startDate) whereClause.fecha_disparo[Op.gte] = startDate;
    if (endDate) whereClause.fecha_disparo[Op.lte] = endDate;
  }
  return whereClause;
};

export const stockAlertReport = async (req, res) => {
  try {
    const data = await fetchAlertData(req.query ?? {});
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al generar reporte de alertas', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

const fetchValueData = async () => {
  const productos = await Producto.findAll({
    attributes: [
      'id',
      'nombre',
      'codigo',
      'stock_actual',
      'precio',
      'categoria_id',
      'proveedor_id',
    ],
    include: [
      { model: Categoria, as: 'Categoria', attributes: ['id', 'nombre'] },
      { model: Proveedor, as: 'Proveedor', attributes: ['id', 'nombre'] },
    ],
  });

  const plain = productos.map((p) => p.get({ plain: true }));

  const byCategoria = new Map();
  const byProveedor = new Map();

  plain.forEach((item) => {
    const stock = Number(item.stock_actual ?? 0);
    const precio = Number(item.precio ?? 0);
    const valor = stock * precio;

    if (item.Categoria) {
      const entry = byCategoria.get(item.Categoria.nombre) || { nombre: item.Categoria.nombre, valor: 0, productos: 0 };
      entry.valor += valor;
      entry.productos += 1;
      byCategoria.set(item.Categoria.nombre, entry);
    }

    if (item.Proveedor) {
      const entry = byProveedor.get(item.Proveedor.nombre) || { nombre: item.Proveedor.nombre, valor: 0, productos: 0 };
      entry.valor += valor;
      entry.productos += 1;
      byProveedor.set(item.Proveedor.nombre, entry);
    }
  });

  const topProductos = plain
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      codigo: item.codigo,
      valor: Number(item.stock_actual ?? 0) * Number(item.precio ?? 0),
      categoria: item.Categoria?.nombre ?? null,
      proveedor: item.Proveedor?.nombre ?? null,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  return {
    categorias: Array.from(byCategoria.values()).sort((a, b) => b.valor - a.valor),
    proveedores: Array.from(byProveedor.values()).sort((a, b) => b.valor - a.valor),
    topProductos,
  };
};

export const valueReport = async (req, res) => {
  try {
    const data = await fetchValueData();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al generar reporte de valorización', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

const fetchTrendData = async ({ months = 12 } = {}) => {
  const monthsInt = clamp(parsePositiveInt(months, 12), 3, 36);
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsInt - 1), 1));

  const rows = await sequelize.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', m.created_at), 'YYYY-MM') AS periodo,
      SUM(CASE WHEN m.tipo IN ('entrada', 'transferencia_entrada') THEN m.cantidad ELSE 0 END) AS entradas,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN m.cantidad ELSE 0 END) AS salidas,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN m.cantidad * COALESCE(p.precio, 0) ELSE 0 END) AS ingresos,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN COALESCE(m.costo_total, 0) ELSE 0 END) AS costos
    FROM movimientos m
    LEFT JOIN productos p ON p.id = m.producto_id
    WHERE m.created_at >= :startDate
    GROUP BY DATE_TRUNC('month', m.created_at)
    ORDER BY DATE_TRUNC('month', m.created_at)
  `, {
    replacements: { startDate: start.toISOString() },
    type: QueryTypes.SELECT,
  });

  return rows.map((row) => {
    const entradas = toNumber(row.entradas);
    const salidas = toNumber(row.salidas);
    const ingresos = toNumber(row.ingresos);
    const costos = toNumber(row.costos);
    const margen = ingresos - costos;
    return {
      periodo: row.periodo,
      entradas,
      salidas,
      neto: entradas - salidas,
      ingresos,
      costos,
      margen,
      margenPorcentaje: ingresos > 0 ? (margen / ingresos) * 100 : null,
    };
  });
};

const fetchPeriodMetrics = async ({ from, to }) => {
  const rows = await sequelize.query(`
    SELECT
      SUM(CASE WHEN m.tipo IN ('entrada', 'transferencia_entrada') THEN m.cantidad ELSE 0 END) AS entradas,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN m.cantidad ELSE 0 END) AS salidas,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN m.cantidad * COALESCE(p.precio, 0) ELSE 0 END) AS ingresos,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN COALESCE(m.costo_total, 0) ELSE 0 END) AS costos,
      COUNT(*) AS movimientos
    FROM movimientos m
    LEFT JOIN productos p ON p.id = m.producto_id
    WHERE m.created_at BETWEEN :startDate AND :endDate
  `, {
    replacements: {
      startDate: setUtcStartOfDay(from).toISOString(),
      endDate: setUtcEndOfDay(to).toISOString(),
    },
    type: QueryTypes.SELECT,
  });

  const [row] = rows;
  const ingresos = toNumber(row?.ingresos);
  const costos = toNumber(row?.costos);
  const margen = ingresos - costos;
  return {
    ventas: toNumber(row?.salidas),
    ingresos,
    costos,
    margen,
    margenPorcentaje: ingresos > 0 ? (margen / ingresos) * 100 : null,
    entradas: toNumber(row?.entradas),
    movimientos: toNumber(row?.movimientos),
  };
};

const buildComparativo = async ({ periodDays = 30 } = {}) => {
  const windowDays = clamp(parsePositiveInt(periodDays, 30), 7, 120);
  const now = new Date();
  const currentTo = setUtcEndOfDay(now);
  const currentFrom = addDays(currentTo, -(windowDays - 1));
  const previousTo = addDays(currentFrom, -1);
  const previousFrom = addDays(previousTo, -(windowDays - 1));

  const [currentMetrics, previousMetrics] = await Promise.all([
    fetchPeriodMetrics({ from: currentFrom, to: currentTo }),
    fetchPeriodMetrics({ from: previousFrom, to: previousTo }),
  ]);

  return {
    periodoActual: {
      desde: currentFrom.toISOString(),
      hasta: currentTo.toISOString(),
      metrics: currentMetrics,
    },
    periodoAnterior: {
      desde: previousFrom.toISOString(),
      hasta: previousTo.toISOString(),
      metrics: previousMetrics,
    },
    variaciones: {
      ventas: percentage(currentMetrics.ventas, previousMetrics.ventas),
      ingresos: percentage(currentMetrics.ingresos, previousMetrics.ingresos),
      margen: percentage(currentMetrics.margen, previousMetrics.margen),
      movimientos: percentage(currentMetrics.movimientos, previousMetrics.movimientos),
    },
  };
};

const buildAbcAnalysis = (products) => {
  const items = products
    .map((product) => {
      const valor = toNumber(product.stock_actual) * toNumber(product.precio);
      return {
        id: product.id,
        codigo: product.codigo,
        nombre: product.nombre,
        stock: toNumber(product.stock_actual),
        precio: toNumber(product.precio),
        valor,
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const totalValor = items.reduce((acc, item) => acc + item.valor, 0);
  let acumulado = 0;

  const clasificados = items.map((item) => {
    acumulado += item.valor;
    const participacion = totalValor > 0 ? (item.valor / totalValor) * 100 : 0;
    const acumuladoPct = totalValor > 0 ? (acumulado / totalValor) * 100 : 0;
    let categoria = 'C';
    if (acumuladoPct <= 70) categoria = 'A';
    else if (acumuladoPct <= 90) categoria = 'B';
    return {
      ...item,
      participacion,
      acumulado: acumuladoPct,
      categoria,
    };
  });

  const resumen = clasificados.reduce((acc, item) => {
    acc[item.categoria] = (acc[item.categoria] || 0) + 1;
    return acc;
  }, {});

  return {
    totalValor,
    categorias: resumen,
    items: clasificados.slice(0, 100),
  };
};

const buildRotationData = async (products, { windowDays = 90 } = {}) => {
  const days = clamp(parsePositiveInt(windowDays, 90), 7, 365);
  const start = addDays(new Date(), -days + 1);
  const ventasRows = await sequelize.query(`
    SELECT
      producto_id,
      SUM(CASE WHEN tipo IN ('salida', 'transferencia_salida') THEN cantidad ELSE 0 END) AS ventas
    FROM movimientos
    WHERE created_at >= :startDate
    GROUP BY producto_id
  `, {
    replacements: { startDate: setUtcStartOfDay(start).toISOString() },
    type: QueryTypes.SELECT,
  });

  const ventasMap = new Map(ventasRows.map((row) => [row.producto_id, toNumber(row.ventas)]));

  const items = products.map((product) => {
    const ventas = ventasMap.get(product.id) || 0;
    const stockActual = toNumber(product.stock_actual);
    const stockMinimo = toNumber(product.stock_minimo);
    const stockPromedio = stockMinimo > 0 ? (stockActual + stockMinimo) / 2 : stockActual || stockMinimo;
    const ventaPromDiaria = ventas / days;
    const rotacion = stockPromedio > 0 ? ventas / stockPromedio : null;
    const diasInventario = ventaPromDiaria > 0 ? stockActual / ventaPromDiaria : null;

    return {
      id: product.id,
      codigo: product.codigo,
      nombre: product.nombre,
      ventas,
      ventaPromDiaria,
      stockActual,
      stockMinimo,
      rotacion,
      diasInventario,
    };
  });

  const totalVentas = items.reduce((acc, item) => acc + item.ventas, 0);

  return {
    windowDays: days,
    totalVentas,
    items: items
      .filter((item) => item.ventas > 0)
      .sort((a, b) => (b.rotacion ?? 0) - (a.rotacion ?? 0))
      .slice(0, 50),
  };
};

const buildProfitabilityData = async (products, { windowDays = 90 } = {}) => {
  const days = clamp(parsePositiveInt(windowDays, 90), 7, 365);
  const start = addDays(new Date(), -days + 1);
  const rows = await sequelize.query(`
    SELECT
      m.producto_id,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN m.cantidad ELSE 0 END) AS unidades,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN m.cantidad * COALESCE(p.precio, 0) ELSE 0 END) AS ingresos,
      SUM(CASE WHEN m.tipo IN ('salida', 'transferencia_salida') THEN COALESCE(m.costo_total, 0) ELSE 0 END) AS costos
    FROM movimientos m
    LEFT JOIN productos p ON p.id = m.producto_id
    WHERE m.tipo IN ('salida', 'transferencia_salida')
      AND m.created_at >= :startDate
    GROUP BY m.producto_id
  `, {
    replacements: { startDate: setUtcStartOfDay(start).toISOString() },
    type: QueryTypes.SELECT,
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const items = rows.map((row) => {
    const product = productMap.get(row.producto_id) ?? {};
    const ingresos = toNumber(row.ingresos);
    const costos = toNumber(row.costos);
    const margen = ingresos - costos;
    return {
      id: row.producto_id,
      codigo: product.codigo,
      nombre: product.nombre,
      unidades: toNumber(row.unidades),
      ingresos,
      costos,
      margen,
      margenPorcentaje: ingresos > 0 ? (margen / ingresos) * 100 : null,
    };
  }).sort((a, b) => b.margen - a.margen);

  const totales = items.reduce((acc, item) => {
    acc.ingresos += item.ingresos;
    acc.costos += item.costos;
    acc.margen += item.margen;
    return acc;
  }, { ingresos: 0, costos: 0, margen: 0 });

  return {
    windowDays: days,
    totales,
    margenPorcentaje: totales.ingresos > 0 ? (totales.margen / totales.ingresos) * 100 : null,
    items: items.slice(0, 50),
  };
};

const buildForecast = (trends, { baseMonths = 3 } = {}) => {
  if (!Array.isArray(trends) || !trends.length) {
    return { proximo: null, series: [] };
  }

  const lastPeriod = trends[trends.length - 1]?.periodo;
  let nextPeriodLabel = null;
  if (lastPeriod) {
    const [year, month] = lastPeriod.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1));
    date.setUTCMonth(date.getUTCMonth() + 1);
    nextPeriodLabel = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  const base = clamp(parsePositiveInt(baseMonths, 3), 2, 6);
  const recent = trends.slice(-base);
  const promedioUnidades = recent.length ? (recent.reduce((acc, item) => acc + toNumber(item.salidas), 0) / recent.length) : 0;
  const promedioIngresos = recent.length ? (recent.reduce((acc, item) => acc + toNumber(item.ingresos), 0) / recent.length) : 0;

  return {
    proximo: nextPeriodLabel ? {
      periodo: nextPeriodLabel,
      unidades: Math.round(promedioUnidades),
      ingresos: Math.round(promedioIngresos),
      baseMeses: recent.length,
    } : null,
    series: trends.map((item) => ({
      periodo: item.periodo,
      ventas: toNumber(item.salidas ?? item.ventas ?? 0),
      ingresos: toNumber(item.ingresos ?? 0),
    })),
  };
};

const buildKpis = ({ comparativos, products, profitability, rotation }) => {
  const currentMetrics = comparativos?.periodoActual?.metrics ?? {};
  const ventasPeriod = toNumber(currentMetrics.ventas);
  const ingresos = toNumber(currentMetrics.ingresos);
  const margen = toNumber(currentMetrics.margen);

  const totalStockActual = products.reduce((acc, product) => acc + toNumber(product.stock_actual), 0);
  const velocity = ventasPeriod > 0 ? ventasPeriod / 30 : 0;
  const diasInventario = velocity > 0 ? totalStockActual / velocity : null;

  const margenPromedio = ingresos > 0 ? (margen / ingresos) * 100 : null;

  return {
    velocity: {
      valor: velocity,
      unidad: 'unidades/día',
      periodoDias: 30,
    },
    diasInventario: {
      valor: diasInventario,
      stockTotal: totalStockActual,
    },
    margenPromedio: {
      porcentaje: margenPromedio,
      ingresos,
      margen,
    },
    rotacionDestacados: rotation?.items?.slice(0, 5) ?? [],
    topRentables: profitability?.items?.slice(0, 5) ?? [],
  };
};

const applyNumberFormat = (row, indexes = []) => {
  indexes.forEach((idx) => {
    const cell = row.getCell(idx);
    if (typeof cell.value === 'number') {
      cell.numFmt = '#,##0.00';
    }
  });
};

const collectAnalyticsData = async (query = {}) => {
  const products = await Producto.findAll({
    attributes: ['id', 'codigo', 'nombre', 'stock_actual', 'stock_minimo', 'precio'],
    raw: true,
  });

  const filters = {
    months: clamp(parsePositiveInt(query?.months, 12), 3, 36),
    rotationWindow: clamp(parsePositiveInt(query?.rotationWindow, 90), 7, 365),
    profitabilityWindow: clamp(parsePositiveInt(query?.profitabilityWindow, 90), 7, 365),
    forecastBase: clamp(parsePositiveInt(query?.forecastBase, 3), 2, 6),
    comparativoWindow: clamp(parsePositiveInt(query?.comparativoWindow, 30), 7, 120),
  };

  const { months, rotationWindow, profitabilityWindow, forecastBase, comparativoWindow } = filters;

  const [trends, comparativos, rotation, profitability] = await Promise.all([
    fetchTrendData({ months }),
    buildComparativo({ periodDays: comparativoWindow }),
    buildRotationData(products, { windowDays: rotationWindow }),
    buildProfitabilityData(products, { windowDays: profitabilityWindow }),
  ]);

  const abc = buildAbcAnalysis(products);
  const forecast = buildForecast(trends, { baseMonths: forecastBase });
  const kpis = buildKpis({ comparativos, products, profitability, rotation });

  return {
    data: {
      trends,
      comparativos,
      abc,
      rotation,
      profitability,
      forecast,
      kpis,
    },
    filters,
  };
};

export const analyticsReport = async (req, res) => {
  try {
    const { data, filters } = await collectAnalyticsData(req.query ?? {});

    return res.json({
      success: true,
      data,
      meta: {
        filters,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al generar analíticas', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

const buildAnalyticsExcel = async (analytics = {}, filters = {}) => {
  const workbook = new ExcelJS.Workbook();

  const {
    trends = [],
    comparativos = {},
    abc = {},
    rotation = {},
    profitability = {},
    forecast = {},
    kpis = {},
  } = analytics;

  const safeNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const safePercent = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num / 100 : null;
  };

  const addHeaderRow = (sheet, values) => {
    const row = sheet.addRow(values);
    row.font = { bold: true };
    return row;
  };

  const applyCurrency = (row, indexes = []) => {
    indexes.forEach((idx) => {
      const cell = row.getCell(idx);
      if (typeof cell.value === 'number') {
        cell.numFmt = '$#,##0.00';
      }
    });
  };

  const applyPercent = (row, indexes = []) => {
    indexes.forEach((idx) => {
      const cell = row.getCell(idx);
      if (typeof cell.value === 'number') {
        cell.numFmt = '0.00%';
      }
    });
  };

  const filtersSheet = workbook.addWorksheet('Filtros');
  filtersSheet.columns = [
    { width: 32 },
    { width: 24 },
  ];

  addHeaderRow(filtersSheet, ['Filtro', 'Valor']);
  const filterRows = [
    ['Meses analizados', filters.months ?? ''],
    ['Ventana rotación (días)', filters.rotationWindow ?? ''],
    ['Ventana rentabilidad (días)', filters.profitabilityWindow ?? ''],
    ['Base pronóstico (meses)', filters.forecastBase ?? ''],
    ['Ventana comparativa (días)', filters.comparativoWindow ?? ''],
    ['Generado', new Date().toISOString()],
  ];
  filterRows.forEach((values) => {
    filtersSheet.addRow(values);
  });

  const kpiSheet = workbook.addWorksheet('KPIs');
  kpiSheet.columns = [
    { width: 36 },
    { width: 20 },
    { width: 18 },
  ];
  addHeaderRow(kpiSheet, ['Indicador', 'Valor', 'Unidad']);

  const velocity = kpis.velocity ?? {};
  const velocityRow = kpiSheet.addRow([
    'Velocidad promedio',
    safeNumber(velocity.valor),
    velocity.unidad ?? '',
  ]);
  applyNumberFormat(velocityRow, [2]);

  const diasInventario = kpis.diasInventario ?? {};
  const diasInventarioRow = kpiSheet.addRow([
    'Días de inventario',
    safeNumber(diasInventario.valor ?? diasInventario.stockTotal ? safeNumber(diasInventario.valor) : safeNumber(diasInventario.valor)),
    diasInventario.valor !== undefined ? 'días' : '',
  ]);
  applyNumberFormat(diasInventarioRow, [2]);

  const margenPromedio = kpis.margenPromedio ?? {};
  const margenRow = kpiSheet.addRow([
    'Margen promedio',
    safePercent(margenPromedio.porcentaje),
    '%',
  ]);
  applyPercent(margenRow, [2]);

  const ingresosRow = kpiSheet.addRow([
    'Ingresos periodo actual',
    safeNumber(margenPromedio.ingresos),
    '$',
  ]);
  applyCurrency(ingresosRow, [2]);

  const margenValorRow = kpiSheet.addRow([
    'Margen periodo actual',
    safeNumber(margenPromedio.margen),
    '$',
  ]);
  applyCurrency(margenValorRow, [2]);

  kpiSheet.addRow([]);
  addHeaderRow(kpiSheet, ['Top rotación (5)', 'Código', 'Unidades']);
  (kpis.rotacionDestacados ?? []).forEach((item) => {
    const row = kpiSheet.addRow([
      item.nombre ?? '',
      item.codigo ?? '',
      safeNumber(item.ventas ?? item.unidades),
    ]);
    applyNumberFormat(row, [3]);
  });

  kpiSheet.addRow([]);
  addHeaderRow(kpiSheet, ['Top rentables (5)', 'Código', 'Margen']);
  (kpis.topRentables ?? []).forEach((item) => {
    const row = kpiSheet.addRow([
      item.nombre ?? '',
      item.codigo ?? '',
      safeNumber(item.margen),
    ]);
    applyCurrency(row, [3]);
  });

  const trendsSheet = workbook.addWorksheet('Tendencias');
  trendsSheet.columns = [
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
  ];
  addHeaderRow(trendsSheet, ['Periodo', 'Entradas', 'Salidas', 'Neto', 'Ingresos', 'Costos', 'Margen', 'Margen %']);
  trends.forEach((item) => {
    const row = trendsSheet.addRow([
      item.periodo ?? '',
      safeNumber(item.entradas),
      safeNumber(item.salidas),
      safeNumber(item.neto),
      safeNumber(item.ingresos),
      safeNumber(item.costos),
      safeNumber(item.margen),
      safePercent(item.margenPorcentaje),
    ]);
    applyCurrency(row, [5, 6, 7]);
    applyPercent(row, [8]);
  });

  const comparativosSheet = workbook.addWorksheet('Comparativos');
  comparativosSheet.columns = [
    { width: 32 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
  ];

  const actual = comparativos.periodoActual?.metrics ?? {};
  const previous = comparativos.periodoAnterior?.metrics ?? {};
  const variaciones = comparativos.variaciones ?? {};

  addHeaderRow(comparativosSheet, ['Métrica', 'Periodo actual', 'Periodo anterior', 'Variación %']);

  const comparativoMetrics = [
    { key: 'ventas', label: 'Ventas (unidades)', type: 'number' },
    { key: 'ingresos', label: 'Ingresos', type: 'currency' },
    { key: 'margen', label: 'Margen', type: 'currency' },
    { key: 'movimientos', label: 'Movimientos', type: 'number' },
    { key: 'entradas', label: 'Entradas', type: 'number' },
  ];

  comparativoMetrics.forEach((metric) => {
    const row = comparativosSheet.addRow([
      metric.label,
      safeNumber(actual[metric.key]),
      safeNumber(previous[metric.key]),
      safePercent(variaciones[metric.key]),
    ]);
    if (metric.type === 'currency') {
      applyCurrency(row, [2, 3]);
    } else {
      applyNumberFormat(row, [2, 3]);
    }
    applyPercent(row, [4]);
  });

  comparativosSheet.addRow([]);
  const periodoInfo = comparativosSheet.addRow([
    'Rango periodo actual',
    comparativos.periodoActual?.desde ?? '',
    comparativos.periodoActual?.hasta ?? '',
  ]);
  periodoInfo.font = { italic: true };
  const periodoPrevioInfo = comparativosSheet.addRow([
    'Rango periodo anterior',
    comparativos.periodoAnterior?.desde ?? '',
    comparativos.periodoAnterior?.hasta ?? '',
  ]);
  periodoPrevioInfo.font = { italic: true };

  const abcSheet = workbook.addWorksheet('ABC');
  abcSheet.columns = [
    { width: 6 },
    { width: 16 },
    { width: 34 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 10 },
  ];
  addHeaderRow(abcSheet, ['#', 'Código', 'Producto', 'Valor', '% participación', '% acumulado', 'Categoría']);
  (abc.items ?? []).forEach((item, index) => {
    const row = abcSheet.addRow([
      index + 1,
      item.codigo ?? '',
      item.nombre ?? '',
      safeNumber(item.valor),
      safePercent(item.participacion),
      safePercent(item.acumulado),
      item.categoria ?? '',
    ]);
    applyCurrency(row, [4]);
    applyPercent(row, [5, 6]);
  });

  const rotationSheet = workbook.addWorksheet('Rotación');
  rotationSheet.columns = [
    { width: 6 },
    { width: 16 },
    { width: 34 },
    { width: 14 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
    { width: 14 },
    { width: 16 },
  ];
  addHeaderRow(rotationSheet, ['#', 'Código', 'Producto', 'Ventas', 'Venta prom. diaria', 'Stock actual', 'Stock mínimo', 'Rotación', 'Días inventario']);
  (rotation.items ?? []).forEach((item, index) => {
    const row = rotationSheet.addRow([
      index + 1,
      item.codigo ?? '',
      item.nombre ?? '',
      safeNumber(item.ventas),
      safeNumber(item.ventaPromDiaria),
      safeNumber(item.stockActual),
      safeNumber(item.stockMinimo),
      safeNumber(item.rotacion),
      safeNumber(item.diasInventario),
    ]);
    applyNumberFormat(row, [4, 5, 6, 7, 8, 9]);
  });

  const profitabilitySheet = workbook.addWorksheet('Rentabilidad');
  profitabilitySheet.columns = [
    { width: 6 },
    { width: 16 },
    { width: 34 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
  ];
  addHeaderRow(profitabilitySheet, ['#', 'Código', 'Producto', 'Unidades', 'Ingresos', 'Costos', 'Margen', 'Margen %']);
  (profitability.items ?? []).forEach((item, index) => {
    const row = profitabilitySheet.addRow([
      index + 1,
      item.codigo ?? '',
      item.nombre ?? '',
      safeNumber(item.unidades),
      safeNumber(item.ingresos),
      safeNumber(item.costos),
      safeNumber(item.margen),
      safePercent(item.margenPorcentaje),
    ]);
    applyCurrency(row, [5, 6, 7]);
    applyPercent(row, [8]);
  });

  const forecastSheet = workbook.addWorksheet('Forecast');
  forecastSheet.columns = [
    { width: 20 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  const proximo = forecast.proximo ?? null;
  addHeaderRow(forecastSheet, ['Próximo periodo', 'Unidades estimadas', 'Ingresos estimados', 'Base (meses)']);
  const proximoRow = forecastSheet.addRow([
    proximo?.periodo ?? '',
    safeNumber(proximo?.unidades),
    safeNumber(proximo?.ingresos),
    proximo?.baseMeses ?? '',
  ]);
  applyCurrency(proximoRow, [3]);
  applyNumberFormat(proximoRow, [2, 4]);

  forecastSheet.addRow([]);
  addHeaderRow(forecastSheet, ['Serie histórica', 'Ventas', 'Ingresos']);
  (forecast.series ?? []).forEach((item) => {
    const row = forecastSheet.addRow([
      item.periodo ?? '',
      safeNumber(item.ventas),
      safeNumber(item.ingresos),
    ]);
    applyCurrency(row, [3]);
    applyNumberFormat(row, [2]);
  });

  return workbook;
};

const buildValueExcel = async (data = {}) => {
  const workbook = new ExcelJS.Workbook();

  const categorias = data.categorias ?? [];
  const proveedores = data.proveedores ?? [];
  const topProductos = data.topProductos ?? [];

  const totalValor = categorias.reduce((acc, item) => acc + Number(item.valor ?? 0), 0);
  const totalProductos = categorias.reduce((acc, item) => acc + Number(item.productos ?? 0), 0);

  const sheet = workbook.addWorksheet('Valorización');
  sheet.columns = [
    { key: 'col1', width: 32 },
    { key: 'col2', width: 22 },
    { key: 'col3', width: 22 },
    { key: 'col4', width: 22 },
    { key: 'col5', width: 22 },
  ];

  const titleRow = sheet.addRow(['Reporte de Valorización']);
  sheet.mergeCells(`A${titleRow.number}:E${titleRow.number}`);
  titleRow.font = { size: 16, bold: true };

  sheet.addRow([]);
  const totalValorRow = sheet.addRow(['Total valor inventario', totalValor]);
  totalValorRow.getCell(2).numFmt = '$#,##0.00';
  sheet.addRow(['Total productos', totalProductos]);
  sheet.addRow(['Categorías analizadas', categorias.length]);
  sheet.addRow(['Proveedores analizados', proveedores.length]);

  const addTable = (title, headers, rows, currencyColumns = []) => {
    sheet.addRow([]);
    const sectionTitleRow = sheet.addRow([title]);
    sheet.mergeCells(`A${sectionTitleRow.number}:E${sectionTitleRow.number}`);
    sectionTitleRow.font = { bold: true, size: 13 };

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };

    rows.forEach((row) => {
      const dataRow = sheet.addRow(row);
      currencyColumns.forEach((colIndex) => {
        const cell = dataRow.getCell(colIndex);
        if (cell && typeof cell.value === 'number') {
          cell.numFmt = '$#,##0.00';
        }
      });
    });
  };

  addTable(
    'Valor por categoría',
    ['Categoría', 'Valor total', 'Productos'],
    categorias.map((row) => [row.nombre, Number(row.valor ?? 0), Number(row.productos ?? 0)]),
    [2],
  );

  addTable(
    'Valor por proveedor',
    ['Proveedor', 'Valor total', 'Productos'],
    proveedores.map((row) => [row.nombre, Number(row.valor ?? 0), Number(row.productos ?? 0)]),
    [2],
  );

  addTable(
    'Top 10 productos por valor',
    ['Producto', 'Código', 'Valor', 'Categoría', 'Proveedor'],
    topProductos.map((row) => [row.nombre, row.codigo, Number(row.valor ?? 0), row.categoria, row.proveedor]),
    [3],
  );

  return workbook;
};

const buildInventoryExcel = async (items, resumen) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventario');

  sheet.addRow(['Reporte de Inventario']);
  sheet.mergeCells('A1', 'F1');
  sheet.getCell('A1').font = { size: 16, bold: true };

  sheet.addRow([]);
  sheet.addRow(['Total productos', resumen.totalProductos]);
  sheet.addRow(['Stock total', resumen.stockTotal]);
  sheet.addRow(['Valor total', resumen.valorTotal]);
  sheet.addRow(['Productos bajo stock', resumen.productosBajoStock]);
  sheet.addRow([]);

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Código', key: 'codigo', width: 15 },
    { header: 'Nombre', key: 'nombre', width: 32 },
    { header: 'Categoría', key: 'categoria', width: 22 },
    { header: 'Proveedor', key: 'proveedor', width: 22 },
    { header: 'Stock', key: 'stock', width: 14 },
    { header: 'Stock mínimo', key: 'stock_minimo', width: 16 },
    { header: 'Precio', key: 'precio', width: 14 },
    { header: 'Valor', key: 'valor', width: 16 },
  ];

  const headerRow = sheet.addRow(sheet.columns.map((column) => column.header));
  headerRow.font = { bold: true };

  items.forEach((item) => {
    const stock = Number(item.stock_actual ?? item.stock ?? 0);
    const precio = Number(item.precio ?? 0);
    sheet.addRow({
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      categoria: item.categoria_nombre ?? item.Categoria?.nombre ?? '',
      proveedor: item.proveedor_nombre ?? item.Proveedor?.nombre ?? '',
      stock,
      stock_minimo: Number(item.stock_minimo ?? 0),
      precio,
      valor: Number((stock * precio).toFixed(2)),
    });
  });

  sheet.getColumn('H').numFmt = '$#,##0.00';
  sheet.getColumn('I').numFmt = '$#,##0.00';

  return workbook;
};

export const exportReportToExcel = async (req, res) => {
  try {
    const { tipo } = req.params;

    if (!['inventario', 'movimientos', 'alertas', 'valorizacion', 'analytics'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo de reporte inválido' });
    }

    let workbook;

    if (tipo === 'inventario') {
      const data = await fetchInventoryData(req.query ?? {});
      workbook = await buildInventoryExcel(data.items ?? [], data.resumen ?? {});
    }

    if (tipo === 'movimientos') {
      workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Movimientos');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Producto', key: 'producto', width: 30 },
        { header: 'Código', key: 'codigo', width: 18 },
        { header: 'Tipo', key: 'tipo', width: 18 },
        { header: 'Cantidad', key: 'cantidad', width: 12 },
        { header: 'Costo total', key: 'costo_total', width: 16 },
        { header: 'Fecha', key: 'fecha', width: 24 },
      ];

      const rows = await Movimiento.findAll({
        where: buildMovementWhere(req.query ?? {}),
        include: [{ model: Producto, as: 'Producto', attributes: ['id', 'nombre', 'codigo'] }],
        order: [['created_at', 'DESC']],
        raw: true,
      });

      const productoNombreKey = 'Producto.nombre';
      const productoCodigoKey = 'Producto.codigo';
      const fechaKey = 'created_at';

      rows.forEach((row) => {
        const productoNombre = row.producto_nombre ?? row[productoNombreKey];
        const productoCodigo = row.producto_codigo ?? row[productoCodigoKey];
        const createdAt = row.created_at ?? row[fechaKey];
        sheet.addRow({
          id: row.id,
          producto: productoNombre ?? '',
          codigo: productoCodigo ?? '',
          tipo: row.tipo,
          cantidad: Number(row.cantidad ?? 0),
          costo_total: Number(row.costo_total ?? 0),
          fecha: createdAt ? new Date(createdAt).toISOString() : '',
        });
      });
    }

    if (tipo === 'alertas') {
      workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Alertas');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Producto', key: 'producto', width: 30 },
        { header: 'Tipo', key: 'tipo', width: 18 },
        { header: 'Prioridad', key: 'prioridad', width: 12 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Fecha disparo', key: 'fecha_disparo', width: 24 },
        { header: 'Fecha resolución', key: 'fecha_resolucion', width: 24 },
      ];

      const rows = await Alerta.findAll({
        where: buildAlertWhere(req.query ?? {}),
        include: [{ model: Producto, attributes: ['id', 'nombre', 'codigo'] }],
        order: [['fecha_disparo', 'DESC']],
      });

      rows.forEach((row) => {
        sheet.addRow({
          id: row.id,
          producto: row.Producto?.nombre ?? '',
          tipo: row.tipo,
          prioridad: row.prioridad,
          estado: row.estado,
          fecha_disparo: row.fecha_disparo ? new Date(row.fecha_disparo).toISOString() : '',
          fecha_resolucion: row.fecha_resolucion ? new Date(row.fecha_resolucion).toISOString() : '',
        });
      });
    }

    if (tipo === 'valorizacion') {
      const data = await fetchValueData();
      workbook = await buildValueExcel(data);
    }

    if (tipo === 'analytics') {
      const { data, filters } = await collectAnalyticsData(req.query ?? {});
      workbook = await buildAnalyticsExcel(data, filters);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);

    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al exportar reporte', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};
