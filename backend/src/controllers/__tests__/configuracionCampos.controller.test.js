import request from 'supertest';
import app from '../../app.js';
import { sequelize } from '../../config/database.js';
import { ConfiguracionCampo, TemplateIndustria, Usuario } from '../../models/index.js';
import { createUser, signToken } from '../../tests/utils/auth.js';

const createAdminToken = async () => {
  const user = await createUser({ rol: 'admin' });
  return signToken({ id: user.id, email: user.email, rol: user.rol });
};

const createCampo = (overrides = {}) => ({
  nombre: `campo_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
  etiqueta: 'Campo Test',
  tipo: 'texto',
  aplica_a: 'productos',
  grupo: 'General',
  industria: 'Retail',
  orden: 1,
  placeholder: 'placeholder',
  ayuda: 'ayuda',
  icono: 'bi-asterisk',
  valor_default: 'default',
  visible_en_listado: true,
  visible_en_detalle: true,
  obligatorio: false,
  activo: true,
  ...overrides,
});

const createTemplate = (overrides = {}) => ({
  nombre: `Template ${Date.now()}`,
  codigo: `TMP_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
  descripcion: 'Template test',
  industria: 'Retail',
  campos_config: [createCampo()],
  ...overrides,
});

beforeAll(async () => {
  await sequelize.sync();
});

afterEach(async () => {
  await ConfiguracionCampo.destroy({ where: {} });
  await TemplateIndustria.destroy({ where: {} });
  await Usuario.destroy({ where: {} });
});


describe('ConfiguracionCampos Controller', () => {
  describe('GET /api/configuracion-campos', () => {
    it('lista campos con filtros de búsqueda', async () => {
      const token = await createAdminToken();
      await ConfiguracionCampo.bulkCreate([
        createCampo({ nombre: 'campo_a', etiqueta: 'Campo A', grupo: 'Info', orden: 1 }),
        createCampo({ nombre: 'campo_b', etiqueta: 'Campo B', grupo: 'Info', orden: 2 }),
      ]);

      const response = await request(app)
        .get('/api/configuracion-campos')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: 'Campo', limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(2);
    });
  });

  describe('POST /api/configuracion-campos', () => {
    it('crea un campo como admin', async () => {
      const token = await createAdminToken();
      const payload = createCampo();

      const response = await request(app)
        .post('/api/configuracion-campos')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe(payload.nombre);
    });

    it('rechaza duplicados', async () => {
      const token = await createAdminToken();
      const payload = createCampo({ nombre: 'duplicado' });
      await ConfiguracionCampo.create(payload);

      const response = await request(app)
        .post('/api/configuracion-campos')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/configuracion-campos/:id', () => {
    it('actualiza un campo existente', async () => {
      const token = await createAdminToken();
      const campo = await ConfiguracionCampo.create(createCampo({ nombre: 'editar_campo', orden: 5 }));

      const response = await request(app)
        .put(`/api/configuracion-campos/${campo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ etiqueta: 'Campo Editado', orden: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.etiqueta).toBe('Campo Editado');
    });

    it('retorna 404 si no existe', async () => {
      const token = await createAdminToken();

      const response = await request(app)
        .put('/api/configuracion-campos/9999')
        .set('Authorization', `Bearer ${token}`)
        .send({ etiqueta: 'No existe' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/configuracion-campos/:id', () => {
    it('elimina un campo existente', async () => {
      const token = await createAdminToken();
      const campo = await ConfiguracionCampo.create(createCampo());

      const response = await request(app)
        .delete(`/api/configuracion-campos/${campo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const stored = await ConfiguracionCampo.findByPk(campo.id);
      expect(stored).toBeNull();
    });
  });

  describe('Templates', () => {
    it('crea y obtiene template por código', async () => {
      const token = await createAdminToken();
      const payload = createTemplate();

      const createResponse = await request(app)
        .post('/api/configuracion-campos/templates')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      const getResponse = await request(app)
        .get(`/api/configuracion-campos/templates/codigo/${payload.codigo}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.codigo).toBe(payload.codigo);
    });
  });
});
