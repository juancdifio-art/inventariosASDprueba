import { Op, fn, col } from 'sequelize';
import { Alerta, Producto, Usuario } from '../models/index.js';

const ALERT_TYPES = new Set(['stock_minimo', 'sin_movimiento', 'vencimiento', 'stock_critico']);
const ALERT_STATES = new Set(['activa', 'leida', 'resuelta', 'ignorada']);
const ALERT_PRIORITIES = new Set(['baja', 'media', 'alta']);

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

export const buildAlertWhere = (query = {}) => {
  const where = {};
  const { tipo, estado, prioridad, producto_id, search } = query;

  if (tipo && ALERT_TYPES.has(tipo)) where.tipo = tipo;
  if (estado && ALERT_STATES.has(estado)) where.estado = estado;
  if (prioridad && ALERT_PRIORITIES.has(prioridad)) where.prioridad = prioridad;
  if (producto_id) {
    const numeric = Number(producto_id);
    if (!Number.isNaN(numeric)) where.producto_id = numeric;
  }

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { titulo: { [Op.iLike]: term } },
      { descripcion: { [Op.iLike]: term } },
    ];
  }

  return where;
};

export const registerAlert = async ({
  producto_id,
  usuario_id = null,
  titulo,
  descripcion = null,
  tipo,
  estado = 'activa',
  prioridad = 'media',
  metadata = null,
}) => {
  if (!titulo || typeof titulo !== 'string') {
    throw new Error('titulo es requerido');
  }
  if (!ALERT_TYPES.has(tipo)) {
    throw new Error('tipo inválido');
  }
  if (!ALERT_STATES.has(estado)) {
    throw new Error('estado inválido');
  }
  if (!ALERT_PRIORITIES.has(prioridad)) {
    throw new Error('prioridad inválida');
  }

  const payload = {
    titulo: normalizeString(titulo),
    descripcion: descripcion ? normalizeString(descripcion) : null,
    tipo,
    estado,
    prioridad,
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
  };

  if (producto_id) {
    const product = await Producto.findByPk(producto_id);
    if (!product) throw new Error('Producto no encontrado');
    payload.producto_id = product.id;
  }

  if (usuario_id) {
    const user = await Usuario.findByPk(usuario_id);
    if (!user) throw new Error('Usuario no encontrado');
    payload.usuario_id = user.id;
  }

  return Alerta.create(payload);
};

export const createAlert = async (req, res) => {
  try {
    const alert = await registerAlert(req.body ?? {});
    return res.status(201).json({ success: true, message: 'Alerta creada', data: alert });
  } catch (error) {
    const status = ['titulo es requerido', 'tipo inválido', 'estado inválido', 'prioridad inválida', 'Producto no encontrado', 'Usuario no encontrado'].includes(error.message)
      ? 400
      : 500;
    return res.status(status).json({ success: false, message: error.message, error: { type: status === 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR' } });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = buildAlertWhere({ ...req.query, search: normalizeString(search) });

    const { rows, count } = await Alerta.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [['fecha_disparo', 'DESC']],
      include: [
        { model: Producto, attributes: ['id', 'nombre', 'codigo'] },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] },
      ],
    });

    return res.json({ success: true, data: { items: rows, total: count, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al listar alertas', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const getAlertById = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id, {
      include: [
        { model: Producto, attributes: ['id', 'nombre', 'codigo'] },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] },
      ],
    });
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    return res.json({ success: true, data: alerta });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener alerta', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

const sanitizeUpdate = (payload) => {
  const update = {};
  if (payload.titulo) update.titulo = normalizeString(payload.titulo);
  if (payload.descripcion !== undefined) update.descripcion = normalizeString(payload.descripcion) || null;
  if (payload.tipo && ALERT_TYPES.has(payload.tipo)) update.tipo = payload.tipo;
  if (payload.estado && ALERT_STATES.has(payload.estado)) update.estado = payload.estado;
  if (payload.prioridad && ALERT_PRIORITIES.has(payload.prioridad)) update.prioridad = payload.prioridad;
  if (payload.metadata !== undefined) update.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  return update;
};

export const updateAlert = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });

    const update = sanitizeUpdate(req.body ?? {});
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron campos válidos para actualizar' });
    }

    if (update.estado && ['resuelta', 'ignorada'].includes(update.estado)) {
      update.fecha_resolucion = new Date();
    }

    await alerta.update(update);
    return res.json({ success: true, message: 'Alerta actualizada', data: alerta });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al actualizar alerta', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const deleted = await Alerta.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    return res.json({ success: true, message: 'Alerta eliminada' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al eliminar alerta', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    if (alerta.estado === 'activa') {
      await alerta.update({ estado: 'leida' });
    }
    return res.json({ success: true, message: 'Alerta marcada como leída', data: alerta });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al marcar alerta como leída', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const resolveAlert = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    await alerta.update({ estado: 'resuelta', fecha_resolucion: new Date() });
    return res.json({ success: true, message: 'Alerta resuelta', data: alerta });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al resolver alerta', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const getAlertStats = async (req, res) => {
  try {
    const stats = await Alerta.findAll({
      attributes: [
        'estado',
        'prioridad',
        [fn('COUNT', col('id')), 'cantidad'],
      ],
      group: ['estado', 'prioridad'],
    });

    const totalsByState = await Alerta.findAll({
      attributes: [
        'estado',
        [fn('COUNT', col('id')), 'cantidad'],
      ],
      group: ['estado'],
    });

    return res.json({
      success: true,
      data: {
        breakdown: stats.map((item) => item.get({ plain: true })),
        totals: totalsByState.map((item) => item.get({ plain: true })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener estadísticas de alertas', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};
