import request from 'supertest';
import app from '../../app.js';
import { sequelize } from '../../config/database.js';
import { Categoria, Producto, Proveedor, Movimiento, Usuario } from '../../models/index.js';
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
});


describe('Dashboard Controller', () => {
  it('retorna resumen con low stock y movimientos recientes', async () => {
    const token = await createAdminToken();
    const categoria = await Categoria.create({ nombre: 'Bebidas', activo: true });
    const proveedor = await Proveedor.create({ nombre: 'Proveedor Cool', activo: true });

    const productoA = await Producto.create({
      codigo: 'DSH-1',
      nombre: 'Gaseosa',
      categoria_id: categoria.id,
      proveedor_id: proveedor.id,
      stock_actual: 3,
      stock_minimo: 5,
      precio: 100,
      activo: true,
    });

    const productoB = await Producto.create({
      codigo: 'DSH-2',
      nombre: 'Agua',
      categoria_id: categoria.id,
      proveedor_id: proveedor.id,
      stock_actual: 10,
      stock_minimo: 2,
      precio: 50,
      activo: true,
    });

    const now = new Date();
    await Movimiento.bulkCreate([
      { producto_id: productoA.id, tipo: 'entrada', cantidad: 5, stock_anterior: 0, stock_nuevo: 5, activo: true, created_at: now, updated_at: now },
      { producto_id: productoB.id, tipo: 'salida', cantidad: 2, stock_anterior: 10, stock_nuevo: 8, activo: true, created_at: now, updated_at: now },
    ]);

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)
      .query({ lowStock: 4, recentProducts: 2, recentMovements: 2 })
      .expect(200);

    expect(response.body.success).toBe(true);
    const { totals, lowStock, recentMovements, recentProducts } = response.body.data;
    expect(totals.productos).toBeGreaterThanOrEqual(2);
    expect(lowStock.items.length).toBe(1);
    expect(recentMovements.length).toBe(2);
    expect(recentProducts.length).toBeLessThanOrEqual(2);
  });
});
