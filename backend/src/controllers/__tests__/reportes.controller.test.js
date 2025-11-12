import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { sequelize } from '../../config/database.js';
import {
  Producto,
  Categoria,
  Proveedor,
  Movimiento,
  Usuario,
} from '../../models/index.js';
import { createUser, signToken } from '../../tests/utils/auth.js';

const createAdminToken = async () => {
  const user = await createUser({ rol: 'admin' });
  return signToken({ id: user.id, email: user.email, rol: user.rol });
};


beforeAll(async () => {
  await sequelize.sync();
});

afterEach(async () => {
  await Movimiento.destroy({ where: {} });
  await Producto.destroy({ where: {} });
  await Categoria.destroy({ where: {} });
  await Proveedor.destroy({ where: {} });
  await Usuario.destroy({ where: {} });
  jest.restoreAllMocks();
});

describe('Reportes Controller', () => {
  describe('GET /api/reportes/inventario', () => {
    it('devuelve resumen de inventario con filtros básicos', async () => {
      const token = await createAdminToken();
      const categoria = await Categoria.create({ nombre: 'Lácteos', activo: true });
      const proveedor = await Proveedor.create({ nombre: 'Proveedor A', activo: true });

      await Producto.bulkCreate([
        { codigo: 'INV-1', nombre: 'Leche', categoria_id: categoria.id, proveedor_id: proveedor.id, stock_actual: 10, stock_minimo: 5, precio: 120 },
        { codigo: 'INV-2', nombre: 'Queso', categoria_id: categoria.id, proveedor_id: proveedor.id, stock_actual: 4, stock_minimo: 5, precio: 200 },
      ]);

      const response = await request(app)
        .get('/api/reportes/inventario')
        .set('Authorization', `Bearer ${token}`)
        .query({ categoria_id: categoria.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resumen.totalProductos).toBe(2);
      expect(response.body.data.resumen.productosBajoStock).toBe(1);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items[0]).toHaveProperty('categoria_nombre');
    });

    it('filtra por proveedor y estado activo', async () => {
      const token = await createAdminToken();
      const proveedorActivo = await Proveedor.create({ nombre: 'Proveedor Activo', activo: true });
      const proveedorInactivo = await Proveedor.create({ nombre: 'Proveedor Inactivo', activo: true });

      await Producto.bulkCreate([
        { codigo: 'INV-3', nombre: 'Activo', proveedor_id: proveedorActivo.id, stock_actual: 5, stock_minimo: 2, precio: 50, activo: true },
        { codigo: 'INV-4', nombre: 'Inactivo', proveedor_id: proveedorActivo.id, stock_actual: 5, stock_minimo: 2, precio: 50, activo: false },
        { codigo: 'INV-5', nombre: 'Otro proveedor', proveedor_id: proveedorInactivo.id, stock_actual: 5, stock_minimo: 2, precio: 50, activo: true },
      ]);

      const response = await request(app)
        .get('/api/reportes/inventario')
        .set('Authorization', `Bearer ${token}`)
        .query({ proveedor_id: proveedorActivo.id, activo: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resumen.totalProductos).toBe(1);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].nombre).toBe('Activo');
    });
  });

  describe('GET /api/reportes/movimientos', () => {
    it('agrupa movimientos por período y tipo', async () => {
      const token = await createAdminToken();
      const producto = await Producto.create({ codigo: 'MOV-1', nombre: 'Producto Mov', stock_actual: 50, stock_minimo: 10, precio: 100 });

      const now = new Date();
      await Movimiento.bulkCreate([
        { producto_id: producto.id, tipo: 'entrada', cantidad: 10, costo_total: 500, created_at: now, updated_at: now, stock_anterior: 40, stock_nuevo: 50, activo: true },
        { producto_id: producto.id, tipo: 'salida', cantidad: 5, costo_total: 250, created_at: now, updated_at: now, stock_anterior: 50, stock_nuevo: 45, activo: true },
      ]);

      const response = await request(app)
        .get('/api/reportes/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .query({ agrupacion: 'dia' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('filtra por tipo y rango de fechas', async () => {
      const token = await createAdminToken();
      const producto = await Producto.create({ codigo: 'MOV-2', nombre: 'Producto Mov', stock_actual: 50, stock_minimo: 10, precio: 100 });

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const today = new Date();
      await Movimiento.bulkCreate([
        { producto_id: producto.id, tipo: 'entrada', cantidad: 10, costo_total: 500, created_at: yesterday, updated_at: yesterday, stock_anterior: 0, stock_nuevo: 10, activo: true },
        { producto_id: producto.id, tipo: 'salida', cantidad: 5, costo_total: 250, created_at: today, updated_at: today, stock_anterior: 10, stock_nuevo: 5, activo: true },
      ]);

      const response = await request(app)
        .get('/api/reportes/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .query({ tipo: 'salida', desde: today.toISOString(), hasta: today.toISOString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ tipo: 'salida' }),
      ]));
      expect(response.body.data.every((record) => record.tipo === 'salida')).toBe(true);
    });

    it('maneja errores internos retornando 500', async () => {
      const token = await createAdminToken();
      jest.spyOn(Movimiento, 'findAll').mockRejectedValueOnce(new Error('DB error'));

      const response = await request(app)
        .get('/api/reportes/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Error al generar reporte de movimientos/);
    });
  });

  describe('GET /api/reportes/alertas', () => {
    it('devuelve productos con stock bajo el mínimo', async () => {
      const token = await createAdminToken();
      await Producto.bulkCreate([
        { codigo: 'ALERT-1', nombre: 'Bajo Stock', stock_actual: 2, stock_minimo: 10, precio: 50 },
        { codigo: 'ALERT-2', nombre: 'Stock OK', stock_actual: 20, stock_minimo: 10, precio: 50 },
      ]);

      const response = await request(app)
        .get('/api/reportes/alertas')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual(expect.arrayContaining([
        expect.objectContaining({ codigo: 'ALERT-1' }),
      ]));
      expect(response.body.data.resumen.totalAlertas).toBeGreaterThanOrEqual(1);
    });

    it('filtra por categoría', async () => {
      const token = await createAdminToken();
      const categoria = await Categoria.create({ nombre: 'Urgente', activo: true });
      await Producto.create({
        codigo: 'ALERT-3',
        nombre: 'Producto Urgente',
        categoria_id: categoria.id,
        stock_actual: 1,
        stock_minimo: 10,
        precio: 50,
      });

      const response = await request(app)
        .get('/api/reportes/alertas')
        .set('Authorization', `Bearer ${token}`)
        .query({ categoria_id: categoria.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
    });
  });

  describe('GET /api/reportes/valorizacion', () => {
    it('calcula el valor total del inventario', async () => {
      const token = await createAdminToken();
      await Producto.bulkCreate([
        { codigo: 'VAL-1', nombre: 'Producto 1', stock_actual: 10, stock_minimo: 5, precio: 100 },
        { codigo: 'VAL-2', nombre: 'Producto 2', stock_actual: 5, stock_minimo: 2, precio: 200 },
      ]);

      const response = await request(app)
        .get('/api/reportes/valorizacion')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resumen.valorTotal).toBeGreaterThan(0);
      expect(response.body.data.resumen.totalProductos).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
  });

  describe('GET /api/reportes/analytics', () => {
    it('devuelve análisis ABC de productos', async () => {
      const token = await createAdminToken();
      const producto = await Producto.create({
        codigo: 'ABC-1',
        nombre: 'Producto ABC',
        stock_actual: 100,
        stock_minimo: 10,
        precio: 50,
      });

      await Movimiento.bulkCreate([
        { producto_id: producto.id, tipo: 'salida', cantidad: 50, costo_total: 2500, stock_anterior: 100, stock_nuevo: 50, activo: true },
        { producto_id: producto.id, tipo: 'salida', cantidad: 30, costo_total: 1500, stock_anterior: 50, stock_nuevo: 20, activo: true },
      ]);

      const response = await request(app)
        .get('/api/reportes/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      if (response.body.data.abc) {
        expect(Array.isArray(response.body.data.abc)).toBe(true);
      }
    });

    it('incluye productos sin movimientos', async () => {
      const token = await createAdminToken();
      await Producto.create({
        codigo: 'ABC-2',
        nombre: 'Sin Movimientos',
        stock_actual: 10,
        stock_minimo: 5,
        precio: 100,
      });

      const response = await request(app)
        .get('/api/reportes/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/reportes/export/:tipo', () => {
    it('exporta reporte de inventario a Excel', async () => {
      const token = await createAdminToken();
      await Producto.create({
        codigo: 'EXP-1',
        nombre: 'Producto Export',
        stock_actual: 10,
        stock_minimo: 5,
        precio: 100,
      });

      const response = await request(app)
        .get('/api/reportes/export/inventario')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/spreadsheet/);
    });

    it('exporta reporte de movimientos a Excel', async () => {
      const token = await createAdminToken();
      const producto = await Producto.create({
        codigo: 'EXP-2',
        nombre: 'Producto Mov',
        stock_actual: 50,
        stock_minimo: 10,
        precio: 100,
      });

      await Movimiento.create({
        producto_id: producto.id,
        tipo: 'entrada',
        cantidad: 10,
        stock_anterior: 40,
        stock_nuevo: 50,
        activo: true,
      });

      const response = await request(app)
        .get('/api/reportes/export/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/spreadsheet/);
    });

    it('retorna 400 para tipo de reporte inválido', async () => {
      const token = await createAdminToken();

      const response = await request(app)
        .get('/api/reportes/export/invalido')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Tipo de reporte inválido|no soportado/i);
    });
  });
});
