import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { sequelize } from '../../config/database.js';
import { Alerta, Producto, Usuario } from '../../models/index.js';

const createUser = async () => {
  return Usuario.create({
    nombre: `Tester ${Date.now()}`,
    email: `tester${Date.now()}@example.com`,
    password_hash: 'hashed',
    rol: 'admin',
    activo: true,
  });
};

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'change_me';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

const createProduct = async () => {
  return Producto.create({
    codigo: `AL-${Date.now()}-${Math.random()}`,
    nombre: 'Producto alertas',
    descripcion: null,
    categoria_id: null,
    proveedor_id: null,
    stock_actual: 20,
    stock_minimo: 5,
    precio: 10,
    atributos_personalizados: null,
    activo: true,
  });
};

beforeAll(async () => {
  await sequelize.sync();
});

afterEach(async () => {
  await Alerta.destroy({ where: {} });
  await Producto.destroy({ where: {} });
  await Usuario.destroy({ where: {} });
});


describe('Alertas API', () => {
  it('crea una alerta', async () => {
    const producto = await createProduct();
    const usuario = await createUser();
    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    const response = await request(app)
      .post('/api/alertas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        producto_id: producto.id,
        usuario_id: usuario.id,
        titulo: 'Stock bajo',
        tipo: 'stock_minimo',
        prioridad: 'alta',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.titulo).toBe('Stock bajo');
  });

  it('lista alertas con filtros y resumen', async () => {
    const producto = await createProduct();
    await Alerta.bulkCreate([
      { producto_id: producto.id, titulo: 'Bajo stock', tipo: 'stock_minimo', prioridad: 'alta', estado: 'activa', activo: true },
      { producto_id: producto.id, titulo: 'Sin movimiento', tipo: 'sin_movimiento', prioridad: 'media', estado: 'leida', activo: true },
    ]);

    const token = signToken({ id: 9999, email: 'admin@example.com', rol: 'admin' });

    const listResponse = await request(app)
      .get('/api/alertas')
      .set('Authorization', `Bearer ${token}`)
      .query({ tipo: 'stock_minimo' })
      .expect(200);

    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.items.length).toBeGreaterThan(0);

    const statsResponse = await request(app)
      .get('/api/alertas/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(statsResponse.body.success).toBe(true);
    expect(Array.isArray(statsResponse.body.data.breakdown)).toBe(true);
  });

  it('actualiza y resuelve una alerta', async () => {
    const alerta = await Alerta.create({
      titulo: 'Stock crítico',
      tipo: 'stock_critico',
      prioridad: 'alta',
      estado: 'activa',
      activo: true,
    });

    const token = signToken({ id: 9998, email: 'admin.tester@example.com', rol: 'admin' });

    await request(app)
      .patch(`/api/alertas/${alerta.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ descripcion: 'Revisar urgentemente', prioridad: 'media' })
      .expect(200);

    const resolveResponse = await request(app)
      .post(`/api/alertas/${alerta.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resolveResponse.body.success).toBe(true);
    expect(resolveResponse.body.data.estado).toBe('resuelta');
  });

  it('marca como leída y elimina', async () => {
    const alerta = await Alerta.create({
      titulo: 'Producto sin movimiento',
      tipo: 'sin_movimiento',
      prioridad: 'baja',
      estado: 'activa',
      activo: true,
    });

    const token = signToken({ id: 9997, email: 'admin2@example.com', rol: 'admin' });

    const readResponse = await request(app)
      .post(`/api/alertas/${alerta.id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(readResponse.body.success).toBe(true);
    expect(readResponse.body.data.estado).toBe('leida');

    await request(app)
      .delete(`/api/alertas/${alerta.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
