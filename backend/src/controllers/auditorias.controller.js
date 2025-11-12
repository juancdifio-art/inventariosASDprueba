import { Op, fn, col, literal } from 'sequelize';
import { Auditoria } from '../models/index.js';

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const parseInteger = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const sanitizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildFilters = (query = {}) => {
  const where = {};
  const { tabla, accion, usuario_id, usuarioId, search, fecha_desde, fecha_hasta, desde, hasta } = query;

  if (tabla) {
    where.tabla = { [Op.iLike]: `%${normalizeString(tabla)}%` };
  }

  if (accion) {
    where.accion = { [Op.iLike]: `%${normalizeString(accion)}%` };
  }

  const user = parseInteger(usuario_id ?? usuarioId);
  if (user !== null) {
    where.usuario_id = user;
  }

  const term = normalizeString(search);
  if (term) {
    where[Op.or] = [
      { descripcion: { [Op.iLike]: `%${term}%` } },
      { registro_id: { [Op.iLike]: `%${term}%` } },
      { usuario_nombre: { [Op.iLike]: `%${term}%` } },
      { usuario_email: { [Op.iLike]: `%${term}%` } },
      { tabla: { [Op.iLike]: `%${term}%` } },
    ];
  }

  const startDate = sanitizeDate(fecha_desde ?? desde);
  const endDate = sanitizeDate(fecha_hasta ?? hasta);
  if (startDate || endDate) {
    const dateCondition = {};
    if (startDate) dateCondition[Op.gte] = startDate;
    if (endDate) dateCondition[Op.lte] = endDate;
    where.fecha_cambio = dateCondition;
  }

  return where;
};

export const listAuditorias = async (req, res) => {
  try {
    const page = parseInteger(req.query.page, 1) || 1;
    const limit = Math.min(parseInteger(req.query.limit, 20) || 20, 100);
    const offset = (page - 1) * limit;
    const where = buildFilters(req.query);

    const { rows, count } = await Auditoria.findAndCountAll({
      where,
      order: [['fecha_cambio', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: {
        items: rows,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al listar auditorías', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const getAuditoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const auditoria = await Auditoria.findByPk(id);
    if (!auditoria) {
      return res.status(404).json({ success: false, message: 'Auditoría no encontrada' });
    }
    return res.json({ success: true, data: auditoria });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener auditoría', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const getHistorialByRegistro = async (req, res) => {
  try {
    const { tabla, registroId } = req.params;
    if (!tabla || !registroId) {
      return res.status(400).json({ success: false, message: 'tabla y registroId son requeridos' });
    }

    const historial = await Auditoria.findAll({
      where: {
        tabla,
        registro_id: registroId,
      },
      order: [['fecha_cambio', 'DESC']],
      limit: parseInteger(req.query.limit, 100) || 100,
    });

    return res.json({ success: true, data: historial });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener historial', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};

export const getAuditoriaStats = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, desde, hasta } = req.query;
    const where = buildFilters({ fecha_desde, fecha_hasta, desde, hasta });

    const [total, porAccion, porTabla, porUsuario] = await Promise.all([
      Auditoria.count({ where }),
      Auditoria.findAll({
        attributes: ['accion', [fn('COUNT', col('id')), 'cantidad']],
        where,
        group: ['accion'],
        order: [['accion', 'ASC']],
      }),
      Auditoria.findAll({
        attributes: ['tabla', [fn('COUNT', col('id')), 'cantidad']],
        where,
        group: ['tabla'],
        order: [[literal('cantidad'), 'DESC']],
        limit: 10,
      }),
      Auditoria.findAll({
        attributes: ['usuario_id', 'usuario_nombre', 'usuario_email', [fn('COUNT', col('id')), 'cantidad']],
        where,
        group: ['usuario_id', 'usuario_nombre', 'usuario_email'],
        order: [[literal('cantidad'), 'DESC']],
        limit: 10,
      }),
    ]);

    const ultimaActividad = await Auditoria.findOne({
      where,
      order: [['fecha_cambio', 'DESC']],
      attributes: ['id', 'tabla', 'registro_id', 'accion', 'fecha_cambio'],
    });

    return res.json({
      success: true,
      data: {
        total,
        porAccion: porAccion.map((item) => item.get({ plain: true })),
        topTablas: porTabla.map((item) => item.get({ plain: true })),
        topUsuarios: porUsuario.map((item) => item.get({ plain: true })),
        ultimaActividad: ultimaActividad ? ultimaActividad.get({ plain: true }) : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener estadísticas de auditoría', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};
