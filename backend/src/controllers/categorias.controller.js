import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Categoria } from '../models/index.js';
import logger from '../utils/logger.js';

const ensureCategoriaSequence = async () => {
  await sequelize.query(
    "SELECT setval('categorias_id_seq', COALESCE((SELECT MAX(id) FROM categorias), 0) + 1, false)"
  );
};

export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = search
      ? { [Op.or]: [{ nombre: { [Op.iLike]: `%${search}%` } }, { descripcion: { [Op.iLike]: `%${search}%` } }] }
      : {};
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const { rows, count } = await Categoria.findAndCountAll({ where, offset: (parsedPage - 1) * parsedLimit, limit: parsedLimit, order: [['id', 'ASC']] });
    logger.info('categorias.list.success', {
      count,
      page: parsedPage,
      limit: parsedLimit,
      hasSearch: Boolean(search),
    });
    return res.json({ success: true, data: { items: rows, total: count, page: parsedPage, limit: parsedLimit } });
  } catch (err) {
    logger.error('categorias.list.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al listar categorías', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await Categoria.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener categoría', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const create = async (req, res) => {
  try {
    const { nombre, descripcion = null, padre_id = null, activo = true } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'Nombre es requerido' });
    let nivel = 0;
    if (padre_id) {
      const padre = await Categoria.findByPk(padre_id);
      if (!padre) return res.status(400).json({ success: false, message: 'padre_id inválido' });
      nivel = (padre.nivel || 0) + 1;
    }
    await ensureCategoriaSequence();
    const item = await Categoria.create({ nombre, descripcion, padre_id, nivel, activo });
    await req.registrarAuditoria?.({
      tabla: 'categorias',
      registroId: item.id,
      accion: 'CREATE',
      valoresAnteriores: null,
      valoresNuevos: item.get({ plain: true }),
      descripcion: `Creación de categoría ${item.nombre}`,
    });
    return res.status(201).json({ success: true, message: 'Categoría creada', data: item });
  } catch (err) {
    logger.error('categorias.create.error', { message: err.message, stack: err.stack, body: req.body });
    return res.status(500).json({ success: false, message: 'Error al crear categoría', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const update = async (req, res) => {
  try {
    const { nombre, descripcion, padre_id, activo } = req.body;
    const item = await Categoria.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    const previousValues = item.get({ plain: true });
    let nivel = item.nivel;
    if (typeof padre_id !== 'undefined') {
      if (padre_id === item.id) return res.status(400).json({ success: false, message: 'padre_id no puede ser el mismo id' });
      if (padre_id) {
        const padre = await Categoria.findByPk(padre_id);
        if (!padre) return res.status(400).json({ success: false, message: 'padre_id inválido' });
        nivel = (padre.nivel || 0) + 1;
      } else {
        nivel = 0;
      }
    }
    await item.update({ nombre, descripcion, padre_id, nivel, activo });
    await req.registrarAuditoria?.({
      tabla: 'categorias',
      registroId: item.id,
      accion: 'UPDATE',
      valoresAnteriores: previousValues,
      valoresNuevos: item.get({ plain: true }),
      descripcion: `Actualización de categoría ${item.nombre}`,
    });
    return res.json({ success: true, message: 'Categoría actualizada', data: item });
  } catch (err) {
    logger.error('categorias.update.error', { message: err.message, stack: err.stack, body: req.body, params: req.params });
    return res.status(500).json({ success: false, message: 'Error al actualizar categoría', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const remove = async (req, res) => {
  try {
    const item = await Categoria.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    const previousValues = item.get({ plain: true });
    await item.destroy();
    await req.registrarAuditoria?.({
      tabla: 'categorias',
      registroId: previousValues.id,
      accion: 'DELETE',
      valoresAnteriores: previousValues,
      valoresNuevos: null,
      descripcion: `Eliminación de categoría ${previousValues.nombre}`,
    });
    return res.json({ success: true, message: 'Categoría eliminada' });
  } catch (err) {
    logger.error('categorias.remove.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({ success: false, message: 'Error al eliminar categoría', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

const buildTree = (list) => {
  const map = new Map();
  const roots = [];
  list.forEach(c => map.set(c.id, { ...c, hijos: [] }));
  list.forEach(c => {
    const node = map.get(c.id);
    if (c.padre_id && map.has(c.padre_id)) {
      map.get(c.padre_id).hijos.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

export const getTree = async (_req, res) => {
  try {
    const rows = await Categoria.findAll({ order: [['nivel', 'ASC'], ['id', 'ASC']] });
    const plain = rows.map(r => r.get({ plain: true }));
    const tree = buildTree(plain);
    logger.info('categorias.tree.success', { total: plain.length });
    return res.json({ success: true, data: tree });
  } catch (err) {
    logger.error('categorias.tree.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al obtener árbol', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};
