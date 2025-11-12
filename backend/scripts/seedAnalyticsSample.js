import { Op } from 'sequelize';
import { sequelize } from '../src/config/database.js';
import { Movimiento, Producto } from '../src/models/index.js';

const SAMPLE_MOTIVO = 'seed analytics sample';
const DAYS_RANGE = 28;

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const setDateTime = (baseDate, hours) => {
  const date = new Date(baseDate);
  date.setHours(hours, randomBetween(0, 59), randomBetween(0, 59), 0);
  return date;
};

const buildEntryMovement = ({ productoId, qty, stockAnterior, createdAt, costoUnitario }) => ({
  producto_id: productoId,
  tipo: 'entrada',
  cantidad: qty,
  stock_anterior: stockAnterior,
  stock_nuevo: stockAnterior + qty,
  costo_unitario: costoUnitario,
  costo_total: costoUnitario * qty,
  motivo: SAMPLE_MOTIVO,
  referencia: 'Carga automática pruebas analytics',
  activo: true,
  created_at: createdAt,
  updated_at: createdAt,
});

const buildSaleMovement = ({ productoId, qty, stockAnterior, createdAt, costoUnitario }) => ({
  producto_id: productoId,
  tipo: 'salida',
  cantidad: qty,
  stock_anterior: stockAnterior,
  stock_nuevo: Math.max(stockAnterior - qty, 0),
  costo_unitario: costoUnitario,
  costo_total: costoUnitario * qty,
  motivo: SAMPLE_MOTIVO,
  referencia: 'Venta simulada pruebas analytics',
  activo: true,
  created_at: createdAt,
  updated_at: createdAt,
});

async function generateSampleData() {
  console.log('[seed] Iniciando generación de movimientos de prueba…');

  const productos = await Producto.findAll({
    where: { activo: true },
    limit: 8,
    order: [['id', 'ASC']],
  });

  if (!productos.length) {
    console.warn('[seed] No se encontraron productos activos. Abortando.');
    return;
  }

  const startWindow = new Date();
  startWindow.setDate(startWindow.getDate() - DAYS_RANGE);

  console.log('[seed] Eliminando movimientos previos del seed…');
  await Movimiento.destroy({ where: { motivo: SAMPLE_MOTIVO } });

  for (const producto of productos) {
    const movimientos = [];
    let stock = Number(producto.stock_actual ?? 0);
    if (!Number.isFinite(stock) || stock <= 0) {
      stock = randomBetween(60, 120);
    }

    const price = Number(producto.precio ?? 0) || randomBetween(2000, 8000) / 100;
    const costBase = price * 0.6;
    const startDate = new Date(startWindow);

    for (let offset = 0; offset < DAYS_RANGE; offset += 1) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + offset);

      if (offset % 6 === 0 || stock < 20) {
        const entryQty = randomBetween(8, 20);
        const createdAt = setDateTime(dayDate, randomBetween(8, 10));
        movimientos.push(buildEntryMovement({
          productoId: producto.id,
          qty: entryQty,
          stockAnterior: stock,
          createdAt,
          costoUnitario: costBase * randomBetween(90, 110) / 100,
        }));
        stock += entryQty;
      }

      const salesCount = randomBetween(0, 2);
      for (let saleIdx = 0; saleIdx < salesCount; saleIdx += 1) {
        const qty = randomBetween(1, 6);
        if (stock < qty) {
          const replenishment = qty + randomBetween(4, 8);
          const createdAt = setDateTime(dayDate, randomBetween(7, 9));
          movimientos.push(buildEntryMovement({
            productoId: producto.id,
            qty: replenishment,
            stockAnterior: stock,
            createdAt,
            costoUnitario: costBase * randomBetween(90, 110) / 100,
          }));
          stock += replenishment;
        }

        const createdAt = setDateTime(dayDate, randomBetween(11, 17));
        const stockAnterior = stock;
        const costoUnitario = costBase * randomBetween(95, 110) / 100;
        movimientos.push(buildSaleMovement({
          productoId: producto.id,
          qty,
          stockAnterior,
          createdAt,
          costoUnitario,
        }));
        stock -= qty;
      }
    }

    movimientos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    await Movimiento.bulkCreate(movimientos);
    await producto.update({ stock_actual: stock });

    console.log(`[seed] Producto ${producto.id} (${producto.nombre}) -> movimientos creados: ${movimientos.length}, stock final: ${stock}`);
  }

  console.log('[seed] Generación completada.');
}

(async () => {
  try {
    await sequelize.authenticate();
    await generateSampleData();
  } catch (error) {
    console.error('[seed] Error al generar datos de prueba:', error);
  } finally {
    await sequelize.close();
  }
})();
