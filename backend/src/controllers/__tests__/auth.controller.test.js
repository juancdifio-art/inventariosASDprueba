import request from 'supertest';
import app from '../../app.js';
import { sequelize } from '../../config/database.js';
import { Usuario } from '../../models/index.js';
import { createUser, signToken } from '../../tests/utils/auth.js';

const buildRegisterPayload = () => ({
  nombre: `Nuevo Usuario ${Date.now()}`,
  email: `nuevo${Date.now()}@example.com`,
  password: 'Password123!',
  rol: 'usuario',
});

beforeAll(async () => {
  await sequelize.sync();
});

afterEach(async () => {
  await Usuario.destroy({ where: {} });
});


describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('registra un usuario y devuelve token', async () => {
      const payload = buildRegisterPayload();

      const response = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      const stored = await Usuario.findOne({ where: { email: payload.email } });
      expect(stored).not.toBeNull();
      expect(stored.rol).toBe('usuario');
    });

    it('rechaza registro con email duplicado', async () => {
      const payload = buildRegisterPayload();
      await createUser({ nombre: payload.nombre, email: payload.email, password: payload.password, rol: payload.rol });

      const response = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Email ya registrado/);
    });
  });

  describe('POST /api/auth/login', () => {
    it('permite iniciar sesión con credenciales válidas', async () => {
      const password = 'Login123!';
      const user = await createUser({ password, rol: 'gerente' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('rechaza credenciales inválidas', async () => {
      const password = 'Login123!';
      const user = await createUser({ password });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Incorrecta1!' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Credenciales inválidas/);
    });

    it('bloquea usuarios inactivos', async () => {
      const password = 'Inactivo123!';
      const user = await createUser({ password, activo: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Credenciales inválidas/);
    });
  });

  describe('GET /api/auth/me', () => {
    it('retorna el perfil del usuario autenticado', async () => {
      const user = await createUser({ rol: 'gerente' });
      const token = signToken({ id: user.id, email: user.email, rol: user.rol });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(user.email);
    });

    it('responde 401 sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Token requerido/);
    });
  });
});
