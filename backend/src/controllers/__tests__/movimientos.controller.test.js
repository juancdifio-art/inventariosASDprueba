import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { sequelize } from '../../config/database.js';
import { Movimiento, Producto, Usuario } from '../../models/index.js';

const createAdminUser = async () => {
  return Usuario.create({
    nombre: `Admin ${Date.now()}`,
    email: `admin${Date.now()}@example.com`,
    password_hash: 'hashed',
    rol: 'admin',
    activo: true,
  });
};

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'change_me';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

const createProducto = async (overrides = {}) => {
  return Producto.create({
    codigo: `MOV-${Date.now()}-${Math.random()}`,
    nombre: 'Producto movimientos',
    descripcion: null,
    categoria_id: null,
    proveedor_id: null,
    stock_actual: 100,
    stock_minimo: 5,
    precio: 50,
    atributos_personalizados: null,
    activo: true,
    ...overrides,
  });
};

beforeAll(async () => {
  await sequelize.sync();
});

afterEach(async () => {
  await Movimiento.destroy({ where: {} });
  await Producto.destroy({ where: {} });
  await Usuario.destroy({ where: {} });
});


describe('POST /api/movimientos', () => {
  it('crea un movimiento de entrada', async () => {
    const producto = await createProducto();
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    const response = await request(app)
      .post('/api/movimientos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        producto_id: producto.id,
        tipo: 'entrada',
        cantidad: 10,
        motivo: 'Compra',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.movimiento.tipo).toBe('entrada');
    const updated = await Producto.findByPk(producto.id);
    expect(Number(updated.stock_actual)).toBe(110);
  });

  it('impide registrar movimiento con stock negativo', async () => {
    const producto = await createProducto({ stock_actual: 5 });
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    const response = await request(app)
      .post('/api/movimientos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        producto_id: producto.id,
        tipo: 'salida',
        cantidad: 10,
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Stock no puede quedar negativo/);
  });
});

describe('POST /api/movimientos/bulk', () => {
  it('registra movimientos masivos en una transacción', async () => {
    const producto = await createProducto({ stock_actual: 50 });
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    const response = await request(app)
      .post('/api/movimientos/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        movimientos: [
          { producto_id: producto.id, tipo: 'entrada', cantidad: 20 },
          { producto_id: producto.id, tipo: 'salida', cantidad: 10 },
        ],
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    const updated = await Producto.findByPk(producto.id);
    expect(Number(updated.stock_actual)).toBe(60);
  });
});

describe('GET /api/movimientos/summary', () => {
  it('devuelve resumen de movimientos por tipo', async () => {
    const producto = await createProducto();
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    await Movimiento.bulkCreate([
      { producto_id: producto.id, tipo: 'entrada', cantidad: 10, stock_anterior: 100, stock_nuevo: 110, activo: true },
      { producto_id: producto.id, tipo: 'salida', cantidad: 5, stock_anterior: 110, stock_nuevo: 105, activo: true },
    ]);

    const response = await request(app)
      .get('/api/movimientos/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    const { items, resumen } = response.body.data;
    expect(Array.isArray(items)).toBe(true);
    expect(resumen.totalMovimientos).toBeGreaterThan(0);
  });
});

describe('GET /api/movimientos', () => {
  it('lista movimientos con paginación', async () => {
    const producto = await createProducto();
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    await Movimiento.bulkCreate([
      { producto_id: producto.id, tipo: 'entrada', cantidad: 10, stock_anterior: 0, stock_nuevo: 10, activo: true },
      { producto_id: producto.id, tipo: 'salida', cantidad: 5, stock_anterior: 10, stock_nuevo: 5, activo: true },
      { producto_id: producto.id, tipo: 'ajuste', cantidad: 20, stock_anterior: 5, stock_nuevo: 20, activo: true },
    ]);

    const response = await request(app)
      .get('/api/movimientos')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 2 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.total).toBe(3);
  });

  it('filtra movimientos por tipo', async () => {
    const producto = await createProducto();
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    await Movimiento.bulkCreate([
      { producto_id: producto.id, tipo: 'entrada', cantidad: 10, stock_anterior: 0, stock_nuevo: 10, activo: true },
      { producto_id: producto.id, tipo: 'salida', cantidad: 5, stock_anterior: 10, stock_nuevo: 5, activo: true },
    ]);

    const response = await request(app)
      .get('/api/movimientos')
      .set('Authorization', `Bearer ${token}`)
      .query({ tipo: 'entrada' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items.every(m => m.tipo === 'entrada')).toBe(true);
  });
});

describe('GET /api/movimientos/:id', () => {
  it('obtiene un movimiento por ID', async () => {
    const producto = await createProducto();
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    const movimiento = await Movimiento.create({
      producto_id: producto.id,
      tipo: 'entrada',
      cantidad: 10,
      stock_anterior: 0,
      stock_nuevo: 10,
      activo: true,
    });

    const response = await request(app)
      .get(`/api/movimientos/${movimiento.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(movimiento.id);
  });

  it('retorna 404 si el movimiento no existe', async () => {
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    const response = await request(app)
      .get('/api/movimientos/9999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});

describe('GET /api/movimientos/producto/:id', () => {
  it('lista movimientos de un producto específico', async () => {
    const producto1 = await createProducto({ codigo: 'PROD-1' });
    const producto2 = await createProducto({ codigo: 'PROD-2' });
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    await Movimiento.bulkCreate([
      { producto_id: producto1.id, tipo: 'entrada', cantidad: 10, stock_anterior: 0, stock_nuevo: 10, activo: true },
      { producto_id: producto2.id, tipo: 'entrada', cantidad: 5, stock_anterior: 0, stock_nuevo: 5, activo: true },
    ]);

    const response = await request(app)
      .get(`/api/movimientos/producto/${producto1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items.every(m => m.producto_id === producto1.id)).toBe(true);
  });
});

describe('GET /api/movimientos/export/csv', () => {
  it('exporta movimientos a CSV', async () => {
    const producto = await createProducto();
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    await Movimiento.create({
      producto_id: producto.id,
      tipo: 'entrada',
      cantidad: 10,
      stock_anterior: 0,
      stock_nuevo: 10,
      activo: true,
    });

    const response = await request(app)
      .get('/api/movimientos/export/csv')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/csv/);
    expect(response.text).toContain('ID');
  });
});

describe('GET /api/movimientos/export/excel', () => {
  it('exporta movimientos a Excel', async () => {
    const producto = await createProducto();
    const usuario = await createAdminUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    await Movimiento.create({
      producto_id: producto.id,
      tipo: 'entrada',
      cantidad: 10,
      stock_anterior: 0,
      stock_nuevo: 10,
      activo: true,
    });

    const response = await request(app)
      .get('/api/movimientos/export/excel')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/spreadsheet/);
  });
});
