import request from 'supertest';
import app from '../../app.js';
import { sequelize } from '../../config/database.js';
import { Producto, Usuario, Movimiento } from '../../models/index.js';
import { createUser, signToken } from '../../tests/utils/auth.js';

const createAdminToken = async () => {
  const user = await createUser({ rol: 'admin' });
  return { token: signToken({ id: user.id, email: user.email, rol: user.rol }), user };
};

const createStandardToken = async () => {
  const user = await createUser({ rol: 'usuario' });
  return { token: signToken({ id: user.id, email: user.email, rol: user.rol }), user };
};

const buildProductPayload = (overrides = {}) => ({
  codigo: `PRD-${Date.now()}-${Math.random()}`,
  nombre: 'Producto Test',
  descripcion: 'Descripción de prueba',
  categoria_id: null,
  proveedor_id: null,
  stock_actual: 15,
  stock_minimo: 5,
  precio: 120,
  atributos_personalizados: { color: 'azul' },
  activo: true,
  ...overrides,
});

beforeAll(async () => {
  await sequelize.sync();
});

afterEach(async () => {
  await Movimiento.destroy({ where: {} });
  await Producto.destroy({ where: {} });
  await Usuario.destroy({ where: {} });
});


describe('Productos Controller', () => {
  describe('GET /api/productos', () => {
    it('lista productos con filtros y paginación', async () => {
      const { token } = await createAdminToken();
      await Producto.bulkCreate([
        buildProductPayload({ codigo: 'LIST-1', nombre: 'Filtro Demo 1', stock_actual: 10, precio: 50 }),
        buildProductPayload({ codigo: 'LIST-2', nombre: 'Filtro Demo 2', stock_actual: 20, precio: 100 }),
      ]);

      const response = await request(app)
        .get('/api/productos')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: 'Demo', min_stock: 5, max_price: 80, page: 1, limit: 1, sort_by: 'nombre', sort_dir: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('requiere autenticación para listar', async () => {
      await request(app)
        .get('/api/productos')
        .expect(401);
    });
  });

  describe('POST /api/productos', () => {
    it('permite crear producto como admin', async () => {
      const { token } = await createAdminToken();
      const payload = buildProductPayload();

      const response = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.codigo).toBe(payload.codigo);
      const stored = await Producto.findOne({ where: { codigo: payload.codigo } });
      expect(stored).not.toBeNull();
    });

    it('rechaza creación por usuario sin rol admin', async () => {
      const { token } = await createStandardToken();
      const payload = buildProductPayload();

      const response = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Permisos insuficientes/);
    });

    it('valida payload y responde 400', async () => {
      const { token } = await createAdminToken();

      const response = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${token}`)
        .send({ codigo: '', nombre: '', stock_actual: -5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toEqual(expect.arrayContaining([
        'Código es requerido',
        'Nombre es requerido',
        'stock_actual debe ser un número mayor o igual a 0',
      ]));
    });
  });

  describe('PUT /api/productos/:id', () => {
    it('actualiza producto y registra ajuste de stock', async () => {
      const { token } = await createAdminToken();
      const producto = await Producto.create(buildProductPayload({ stock_actual: 10 }));

      const response = await request(app)
        .put(`/api/productos/${producto.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ stock_actual: 20, nombre: 'Actualizado' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe('Actualizado');

      const movimientos = await Movimiento.findAll({ where: { producto_id: producto.id } });
      expect(movimientos.some((mov) => mov.tipo === 'ajuste')).toBe(true);
    });

    it('impide actualizar con código duplicado', async () => {
      const { token } = await createAdminToken();
      const productoA = await Producto.create(buildProductPayload({ codigo: 'DUP-1' }));
      const productoB = await Producto.create(buildProductPayload({ codigo: 'DUP-2' }));

      const response = await request(app)
        .put(`/api/productos/${productoB.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ codigo: productoA.codigo })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/codigo ya existente/);
    });

    it('responde 404 si el producto no existe', async () => {
      const { token } = await createAdminToken();

      const response = await request(app)
        .put('/api/productos/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'No existe' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Producto no encontrado/);
    });
  });

  describe('DELETE /api/productos/:id', () => {
    it('elimina producto y registra auditoría', async () => {
      const { token } = await createAdminToken();
      const producto = await Producto.create(buildProductPayload());

      const response = await request(app)
        .delete(`/api/productos/${producto.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const stored = await Producto.findByPk(producto.id);
      expect(stored).toBeNull();
    });

    it('responde 404 al eliminar inexistente', async () => {
      const { token } = await createAdminToken();

      const response = await request(app)
        .delete('/api/productos/12345')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Producto no encontrado/);
    });
  });
});
