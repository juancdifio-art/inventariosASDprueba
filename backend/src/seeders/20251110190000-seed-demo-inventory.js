/* eslint-disable camelcase */

import { Op } from 'sequelize';

const DEMO_PREFIX = 'DEMO-SEED';
const PRODUCT_COUNT = 200;
const TOP_INTENSIVE_COUNT = 30;

const createRng = (seed) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const rng = createRng(20251111);
const randomBetween = (min, max) => min + (max - min) * rng();
const randomInt = (min, max) => Math.round(randomBetween(min, max));

const chooseRandom = (items) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index] ?? null;
};

const buildOffsets = (count, spanDays) => {
  if (!count || count <= 0) return [];
  const offsets = [];
  const step = spanDays / (count + 1);
  for (let i = 0; i < count; i += 1) {
    const base = Math.round(step * (i + 1));
    const jitter = randomInt(-6, 6);
    const daysAgo = Math.max(1, Math.min(spanDays, base + jitter));
    offsets.push(-daysAgo);
  }
  offsets.sort((a, b) => a - b);
  return offsets;
};

const shuffleArray = (items) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const entryMotives = [
  'Reposición inicial demo',
  'Recepción de proveedor demo',
  'Compra programada demo',
];

const exitMotives = [
  'Venta demo',
  'Consumo interno demo',
  'Transferencia a sucursal demo',
];

const categoriesPlan = [
  { key: 'electronica', nombre: 'Electrónica & Gadgets', descripcion: 'Dispositivos y accesorios tecnológicos' },
  { key: 'alimentos', nombre: 'Alimentos Gourmet', descripcion: 'Productos alimenticios premium' },
  { key: 'hogar', nombre: 'Hogar & Deco', descripcion: 'Artículos para el hogar y decoración' },
  { key: 'oficina', nombre: 'Oficina & Papelería', descripcion: 'Consumibles y mobiliario de oficina' },
  { key: 'salud', nombre: 'Salud & Cuidado Personal', descripcion: 'Bienestar y cuidado diario' },
  { key: 'herramientas', nombre: 'Herramientas Industriales', descripcion: 'Equipos y herramientas de uso intensivo' },
  { key: 'moda', nombre: 'Moda & Accesorios', descripcion: 'Indumentaria y complementos de temporada' },
  { key: 'limpieza', nombre: 'Limpieza Profesional', descripcion: 'Insumos para higiene y mantenimiento' },
  { key: 'jardineria', nombre: 'Jardinería Urbana', descripcion: 'Cuidado de plantas y espacios verdes' },
  { key: 'automotriz', nombre: 'Automotriz & Movilidad', descripcion: 'Accesorios y mantenimiento vehicular' },
];

const proveedoresPlan = [
  { key: 'andes', nombre: 'Andes Distribution', ciudad: 'Mendoza', pais: 'Argentina', rubro: 'Logística', dias_entrega: 5 },
  { key: 'pampas', nombre: 'Pampas Foods', ciudad: 'Buenos Aires', pais: 'Argentina', rubro: 'Alimentos', dias_entrega: 3 },
  { key: 'lumina', nombre: 'Lumina Tech', ciudad: 'Córdoba', pais: 'Argentina', rubro: 'Electrónica', dias_entrega: 7 },
  { key: 'papeleros', nombre: 'Papeleros SRL', ciudad: 'Rosario', pais: 'Argentina', rubro: 'Papelería', dias_entrega: 4 },
  { key: 'vital', nombre: 'Vital Care Group', ciudad: 'La Plata', pais: 'Argentina', rubro: 'Salud', dias_entrega: 6 },
  { key: 'patagonia', nombre: 'Patagonia Supplies', ciudad: 'Bariloche', pais: 'Argentina', rubro: 'Outdoors', dias_entrega: 8 },
  { key: 'norte', nombre: 'Norte Agroinsumos', ciudad: 'Salta', pais: 'Argentina', rubro: 'Agroinsumos', dias_entrega: 9 },
  { key: 'atlantica', nombre: 'Atlántica Bebidas', ciudad: 'Mar del Plata', pais: 'Argentina', rubro: 'Bebidas', dias_entrega: 4 },
  { key: 'ecologistics', nombre: 'EcoLogistics Partners', ciudad: 'San Juan', pais: 'Argentina', rubro: 'Logística', dias_entrega: 10 },
  { key: 'quantum', nombre: 'Quantum Components', ciudad: 'San Luis', pais: 'Argentina', rubro: 'Componentes electrónicos', dias_entrega: 6 },
  { key: 'delta', nombre: 'Delta Textiles', ciudad: 'Tucumán', pais: 'Argentina', rubro: 'Textiles', dias_entrega: 7 },
  { key: 'urban', nombre: 'Urban Tools Factory', ciudad: 'Neuquén', pais: 'Argentina', rubro: 'Herramientas', dias_entrega: 5 },
  { key: 'andina', nombre: 'Andina FarmaLab', ciudad: 'San Rafael', pais: 'Argentina', rubro: 'Farmacéutica', dias_entrega: 6 },
  { key: 'surenergy', nombre: 'SurEnergy Solutions', ciudad: 'Comodoro Rivadavia', pais: 'Argentina', rubro: 'Energía', dias_entrega: 12 },
  { key: 'fusion', nombre: 'Fusión Gourmet', ciudad: 'San Isidro', pais: 'Argentina', rubro: 'Alimentos', dias_entrega: 5 },
  { key: 'novaplast', nombre: 'Nova Plastics', ciudad: 'Villa María', pais: 'Argentina', rubro: 'Plásticos', dias_entrega: 8 },
  { key: 'copperline', nombre: 'Copperline Metals', ciudad: 'Río Cuarto', pais: 'Argentina', rubro: 'Metales', dias_entrega: 11 },
  { key: 'horizon', nombre: 'Horizon Equipamientos', ciudad: 'Bahía Blanca', pais: 'Argentina', rubro: 'Equipamiento industrial', dias_entrega: 9 },
  { key: 'terra', nombre: 'Terra Verde Semillas', ciudad: 'Pergamino', pais: 'Argentina', rubro: 'Semillas', dias_entrega: 6 },
  { key: 'puntolimpio', nombre: 'Punto Limpio Servicios', ciudad: 'San Nicolás', pais: 'Argentina', rubro: 'Limpieza', dias_entrega: 4 },
];

export default {
  async up(queryInterface) {
    const { QueryTypes } = queryInterface.sequelize;
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const existingDemoProducts = await queryInterface.sequelize.query(
        "SELECT COUNT(*) AS count FROM productos WHERE codigo LIKE 'DEMO-%'",
        { type: QueryTypes.SELECT, transaction }
      );

      if (Number(existingDemoProducts?.[0]?.count ?? 0) > 0) {
        await transaction.commit();
        return;
      }

      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const fourMonthsDays = 30 * 4;

      const categoriasInsert = categoriesPlan.map((cat) => ({
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        padre_id: null,
        nivel: 0,
        activo: true,
        created_at: now,
        updated_at: now,
      }));

      await queryInterface.bulkInsert('categorias', categoriasInsert, { transaction });

      const categoriasRows = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM categorias WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: categoriesPlan.map((c) => c.nombre) },
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      const categoriaMap = categoriasRows.reduce((acc, row) => {
        acc[row.nombre] = row.id;
        return acc;
      }, {});

      const proveedoresInsert = proveedoresPlan.map((prov, index) => ({
        nombre: prov.nombre,
        cuit: `30-1234567${index + 10}-9`,
        email: `${prov.key}@demo-inventarios.test`,
        telefono: '+54 11 4000-0000',
        direccion: `${(index + 1) * 100} Av. Principal`,
        ciudad: prov.ciudad,
        provincia: 'Buenos Aires',
        pais: prov.pais,
        codigo_postal: '1000',
        sitio_web: `https://www.${prov.key}.demo`,
        contacto: `Contacto ${prov.nombre}`,
        cargo_contacto: 'Ejecutivo Comercial',
        email_contacto: `contacto@${prov.key}.demo`,
        condicion_pago: 'Cuenta corriente 30 días',
        dias_entrega: prov.dias_entrega,
        rubro: prov.rubro,
        logistica: 'Estándar',
        logistica_contacto: 'Logística Central',
        rating: 'A',
        monto_minimo: 50000,
        notas: 'Proveedor de datos demostrativos.',
        activo: true,
        created_at: now,
        updated_at: now,
      }));

      await queryInterface.bulkInsert('proveedores', proveedoresInsert, { transaction });

      const proveedoresRows = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM proveedores WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: proveedoresPlan.map((p) => p.nombre) },
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      const proveedorMap = proveedoresRows.reduce((acc, row) => {
        acc[row.nombre] = row.id;
        return acc;
      }, {});

      const productsPlan = Array.from({ length: PRODUCT_COUNT }).map((_, index) => {
        const category = categoriesPlan[index % categoriesPlan.length];
        const proveedor = proveedoresPlan[index % proveedoresPlan.length];
        const priceBase = 11000 + randomInt(0, 24) * 850 + Math.floor(index / 25) * 1200;
        const baseEntrada = randomInt(45, 220);
        const salidaPasada = randomInt(12, Math.max(12, Math.floor(baseEntrada * 0.65)));
        const entradaExtra = randomInt(20, 150);
        const salidaExtra = randomInt(10, Math.max(10, Math.floor((baseEntrada + entradaExtra) * 0.5)));
        const finalStock = Math.max(0, baseEntrada - salidaPasada + entradaExtra - salidaExtra);
        const stockMinimo = randomInt(8, 60);
        const shouldBeLowStock = rng() < 0.25;
        const adjustedStock = shouldBeLowStock
          ? Math.max(0, Math.floor(stockMinimo * randomBetween(0.2, 0.85)))
          : finalStock;

        const price = priceBase + randomInt(-900, 1200);
        const createdAt = new Date(now.getTime() - randomInt(10, fourMonthsDays) * dayMs);

        return {
          codigo: `DEMO-P-${String(index + 1).padStart(3, '0')}`,
          nombre: `Producto Demo ${index + 1}`,
          descripcion: `Producto de demostración ${index + 1} para pruebas de dashboard y reportes.`,
          categoriaNombre: category.nombre,
          proveedorNombre: proveedor.nombre,
          stock_minimo: stockMinimo,
          stock_actual: adjustedStock,
          precio: price,
          baseEntrada,
          salidaPasada,
          entradaExtra,
          salidaExtra,
          isLowStock: shouldBeLowStock,
          createdAt,
        };
      });

      const productosInsert = productsPlan.map((prod) => ({
        codigo: prod.codigo,
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        categoria_id: categoriaMap[prod.categoriaNombre] ?? null,
        proveedor_id: proveedorMap[prod.proveedorNombre] ?? null,
        stock_actual: prod.stock_actual,
        stock_minimo: prod.stock_minimo,
        precio: prod.precio,
        activo: true,
        created_at: prod.createdAt,
        updated_at: prod.createdAt,
      }));

      await queryInterface.bulkInsert('productos', productosInsert, { transaction });

      const productosRows = await queryInterface.sequelize.query(
        'SELECT id, codigo FROM productos WHERE codigo IN (:codigos)',
        {
          replacements: { codigos: productsPlan.map((p) => p.codigo) },
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      const productoMap = productosRows.reduce((acc, row) => {
        acc[row.codigo] = row.id;
        return acc;
      }, {});

      const movimientosInsert = [];
      productsPlan.forEach((prod, index) => {
        const productoId = productoMap[prod.codigo];
        if (!productoId) return;

        const priceUnit = Number((prod.precio / 1.21).toFixed(2));
        const movementPlan = [];
        let currentStock = 0;

        const scheduleMovement = (type, desiredQty) => {
          if (!desiredQty || desiredQty <= 0) return;
          let quantity = Math.max(1, Math.round(desiredQty));
          if (type === 'salida') {
            quantity = Math.min(quantity, currentStock);
            if (quantity <= 0) return;
          }
          const stockAnterior = currentStock;
          const stockNuevo = type === 'entrada' ? stockAnterior + quantity : stockAnterior - quantity;
          movementPlan.push({ type, quantity, stockAnterior, stockNuevo });
          currentStock = stockNuevo;
        };

        const highVolumeBias = index < TOP_INTENSIVE_COUNT;
        const baseMovements = [{ type: 'entrada', amount: prod.baseEntrada }];
        if ((highVolumeBias ? rng() < 0.98 : rng() < 0.35)) {
          baseMovements.push({ type: 'salida', amount: prod.salidaPasada });
        }
        if ((highVolumeBias ? rng() < 0.85 : rng() < 0.25)) {
          baseMovements.push({ type: 'entrada', amount: prod.entradaExtra });
        }
        if ((highVolumeBias ? rng() < 0.75 : rng() < 0.18)) {
          baseMovements.push({ type: 'salida', amount: prod.salidaExtra });
        }

        let extraMovementCount;
        if (highVolumeBias) {
          extraMovementCount = randomInt(34, 52);
          if (rng() < 0.4) {
            extraMovementCount += randomInt(4, 9);
          }
        } else {
          extraMovementCount = randomInt(0, 2);
          if (rng() < 0.15) {
            extraMovementCount += 1;
          }
        }

        const averageEntry = Math.max(10, Math.round((prod.baseEntrada + prod.entradaExtra) / 2));
        const averageExit = Math.max(6, Math.round((prod.salidaPasada + prod.salidaExtra) / 2));

        const extraMovements = Array.from({ length: extraMovementCount }).map(() => {
          const preferExit = rng() < (highVolumeBias ? 0.6 : 0.35);
          const baseAmount = preferExit ? averageExit : averageEntry;
          const amount = Math.max(1, Math.round(baseAmount * randomBetween(0.4, 1.6)));
          return { type: preferExit ? 'salida' : 'entrada', amount };
        });

        const orderedMovements = [baseMovements[0], ...shuffleArray([...baseMovements.slice(1), ...extraMovements])];

        orderedMovements.forEach((movement, position) => {
          const volatility = randomBetween(0.6, 1.45);
          const intensity = highVolumeBias ? randomBetween(1.2, 1.7) : randomBetween(0.35, 0.85);
          const desired = movement.amount * volatility * intensity;
          scheduleMovement(movement.type, desired);
          const quickAdjustChance = highVolumeBias ? 0.24 : 0.05;
          if (movementPlan.length > 1 && position % 3 === 0 && rng() < quickAdjustChance) {
            const quickAdjustType = rng() < (highVolumeBias ? 0.55 : 0.4) ? 'entrada' : 'salida';
            const quickAmount = quickAdjustType === 'entrada'
              ? randomInt(3, Math.max(6, Math.round(averageEntry * 0.4)))
              : randomInt(2, Math.max(4, Math.round((currentStock || averageExit) * 0.35)));
            scheduleMovement(quickAdjustType, quickAmount);
          }
        });

        const diff = prod.stock_actual - currentStock;
        if (diff > 0) {
          scheduleMovement('entrada', diff);
        } else if (diff < 0) {
          scheduleMovement('salida', Math.min(currentStock, Math.abs(diff)));
        }

        if (movementPlan.length < 3) {
          scheduleMovement('entrada', randomInt(6, 28));
        }

        const offsets = buildOffsets(movementPlan.length, fourMonthsDays);
        const referenceBase = `${DEMO_PREFIX}-${prod.codigo}`;

        movementPlan.forEach((plan, index) => {
          const createdAtOffset = offsets[index];
          const createdAt = new Date(now.getTime() + createdAtOffset * dayMs);
          const motivePool = plan.type === 'entrada' ? entryMotives : exitMotives;
          const motivo = chooseRandom(motivePool);

          movimientosInsert.push({
            producto_id: productoId,
            tipo: plan.type,
            cantidad: plan.quantity,
            stock_anterior: plan.stockAnterior,
            stock_nuevo: plan.stockNuevo,
            costo_unitario: priceUnit,
            costo_total: Number((priceUnit * plan.quantity).toFixed(2)),
            motivo,
            referencia: `${referenceBase}-${String(index + 1).padStart(2, '0')}`,
            activo: true,
            created_at: createdAt,
            updated_at: createdAt,
          });
        });
      });

      await queryInterface.bulkInsert('movimientos', movimientosInsert, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'movimientos',
        { referencia: { [Op.like]: `${DEMO_PREFIX}-%` } },
        { transaction }
      );

      const productCodes = Array.from({ length: PRODUCT_COUNT }).map((_, index) => `DEMO-P-${String(index + 1).padStart(3, '0')}`);
      await queryInterface.bulkDelete('productos', { codigo: productCodes }, { transaction });

      await queryInterface.bulkDelete('proveedores', { nombre: proveedoresPlan.map((p) => p.nombre) }, { transaction });

      await queryInterface.bulkDelete('categorias', { nombre: categoriesPlan.map((c) => c.nombre) }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
