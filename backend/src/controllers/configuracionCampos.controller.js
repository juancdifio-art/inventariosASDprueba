import { Op } from 'sequelize';
import { ConfiguracionCampo, TemplateIndustria, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';
import {
  sanitizeCampoPayload,
  validateCampoPayload,
  sanitizeTemplatePayload,
  validateTemplatePayload,
  validateValorContraCampo,
  CAMPO_TYPES,
  APLICA_A_VALUES,
} from '../validators/configuracionCampos.validator.js';

const CAMPO_FIELD_KEYS = [
  'id',
  'nombre',
  'etiqueta',
  'descripcion',
  'tipo',
  'aplica_a',
  'grupo',
  'industria',
  'orden',
  'placeholder',
  'ayuda',
  'icono',
  'valor_default',
  'opciones',
  'validaciones',
  'obligatorio',
  'visible_en_listado',
  'visible_en_detalle',
  'activo',
  'created_at',
  'updated_at',
];

const booleanTrueValues = new Set(['true', '1', 'yes', 'si', 'sí', 'on']);
const booleanFalseValues = new Set(['false', '0', 'no', 'off']);

const parseBooleanQuery = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (booleanTrueValues.has(normalized)) return true;
  if (booleanFalseValues.has(normalized)) return false;
  return undefined;
};

const serializeValorDefault = (valor, tipo) => {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  if (tipo === 'multi_select') {
    return JSON.stringify(Array.isArray(valor) ? valor : [valor].filter(Boolean));
  }
  if (typeof valor === 'object') {
    return JSON.stringify(valor);
  }
  return String(valor);
};

const parseValorDefault = (valor, tipo) => {
  if (valor === null || valor === undefined) return null;
  if (tipo === 'multi_select') {
    if (Array.isArray(valor)) return valor;
    if (typeof valor === 'string') {
      try {
        const parsed = JSON.parse(valor);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        const parts = valor.split(',').map((item) => item.trim()).filter(Boolean);
        if (parts.length) return parts;
      }
    }
    return [];
  }
  if (tipo === 'numero') {
    const parsed = Number.parseInt(valor, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (tipo === 'decimal') {
    const parsed = Number(valor);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (tipo === 'boolean') {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'number') return valor !== 0;
    if (typeof valor === 'string') {
      const normalized = valor.trim().toLowerCase();
      if (booleanTrueValues.has(normalized)) return true;
      if (booleanFalseValues.has(normalized)) return false;
    }
    return null;
  }
  return valor;
};

const pruneUndefined = (object) => {
  const result = { ...object };
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) delete result[key];
  });
  return result;
};

const formatCampoResponse = (campo) => {
  const plain = campo?.get ? campo.get({ plain: true }) : { ...campo };
  const formatted = { ...plain };
  formatted.valor_default = parseValorDefault(plain.valor_default, plain.tipo);
  return formatted;
};

const prepareCampoPersistencePayload = (sanitized, currentTipo) => {
  const payload = { ...sanitized };
  const tipo = sanitized.tipo ?? currentTipo;
  if (payload.valor_default !== undefined) {
    payload.valor_default = serializeValorDefault(payload.valor_default, tipo);
  }
  return pruneUndefined(payload);
};

const formatTemplateResponse = (template) => {
  const plain = template?.get ? template.get({ plain: true }) : { ...template };
  const formatted = { ...plain };
  if (Array.isArray(plain.campos_config)) {
    formatted.campos_config = plain.campos_config.map((campoConfig) => formatCampoResponse(campoConfig));
  }
  return formatted;
};

const pickCampoData = (campo) => {
  const formatted = formatCampoResponse(campo);
  return CAMPO_FIELD_KEYS.reduce((acc, key) => {
    if (formatted[key] !== undefined) acc[key] = formatted[key];
    return acc;
  }, {});
};

export const listCampos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      aplica_a,
      tipo,
      grupo,
      industria,
      activo,
      search,
      sort_by = 'orden',
      sort_dir = 'asc',
    } = req.query;

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 50));

    const where = {};
    if (aplica_a && APLICA_A_VALUES.includes(aplica_a)) where.aplica_a = aplica_a;
    if (tipo && CAMPO_TYPES.includes(tipo)) where.tipo = tipo;
    if (grupo) where.grupo = { [Op.iLike]: `%${grupo}%` };
    if (industria) where.industria = { [Op.iLike]: `%${industria}%` };
    const activoFilter = parseBooleanQuery(activo);
    if (activoFilter !== undefined) where.activo = activoFilter;
    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { nombre: { [Op.iLike]: like } },
        { etiqueta: { [Op.iLike]: like } },
        { descripcion: { [Op.iLike]: like } },
      ];
    }

    const sortableFields = new Set(['orden', 'nombre', 'aplica_a', 'tipo', 'created_at']);
    const sortField = sortableFields.has(sort_by) ? sort_by : 'orden';
    const sortDirection = String(sort_dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { rows, count } = await ConfiguracionCampo.findAndCountAll({
      where,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      order: [[sortField, sortDirection]],
    });

    return res.json({
      success: true,
      data: {
        items: rows.map(formatCampoResponse),
        total: count,
        page: parsedPage,
        limit: parsedLimit,
      },
    });
  } catch (err) {
    logger.error('configCampos.list.error', { message: err.message, stack: err.stack });
    return res.status(500).json({
      success: false,
      message: 'Error al listar campos configurables',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const getCampoById = async (req, res) => {
  try {
    const campo = await ConfiguracionCampo.findByPk(req.params.id);
    if (!campo) {
      return res.status(404).json({ success: false, message: 'Campo no encontrado' });
    }
    return res.json({ success: true, data: formatCampoResponse(campo) });
  } catch (err) {
    logger.error('configCampos.get.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el campo',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const getCamposPorAplicacion = async (req, res) => {
  try {
    const aplica = String(req.params.aplica_a || '').toLowerCase();
    if (!APLICA_A_VALUES.includes(aplica)) {
      return res.status(400).json({ success: false, message: 'aplica_a inválido' });
    }

    const {
      industria,
      agrupados,
      solo_visibles_en_listado,
      solo_visibles_en_detalle,
    } = req.query;

    const where = { aplica_a: aplica, activo: true };
    if (industria) where[Op.or] = [{ industria: { [Op.iLike]: `%${industria}%` } }, { industria: null }];

    const visibleListado = parseBooleanQuery(solo_visibles_en_listado);
    if (visibleListado !== undefined) where.visible_en_listado = visibleListado;

    const visibleDetalle = parseBooleanQuery(solo_visibles_en_detalle);
    if (visibleDetalle !== undefined) where.visible_en_detalle = visibleDetalle;

    const campos = await ConfiguracionCampo.findAll({
      where,
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
    });

    const formatted = campos.map(formatCampoResponse);
    const agrupadosFlag = parseBooleanQuery(agrupados);
    if (agrupadosFlag) {
      const grouped = formatted.reduce((acc, campoItem) => {
        const groupName = campoItem.grupo || 'Sin Grupo';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(campoItem);
        return acc;
      }, {});
      return res.json({ success: true, data: grouped });
    }

    return res.json({ success: true, data: formatted });
  } catch (err) {
    logger.error('configCampos.byAplicacion.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener campos por aplicación',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const createCampo = async (req, res) => {
  try {
    const { sanitized, meta } = sanitizeCampoPayload(req.body, { partial: false });
    const validationErrors = validateCampoPayload(sanitized, { partial: false, meta });
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        error: { type: 'VALIDATION_ERROR', details: validationErrors },
      });
    }

    const nombreExists = await ConfiguracionCampo.findOne({ where: { nombre: sanitized.nombre } });
    if (nombreExists) {
      return res.status(409).json({ success: false, message: 'Nombre de campo ya existente' });
    }

    const payload = prepareCampoPersistencePayload(sanitized, sanitized.tipo);
    const campo = await ConfiguracionCampo.create(payload);

    await req.registrarAuditoria?.({
      tabla: 'configuracion_campos',
      registroId: campo.id,
      accion: 'CREATE',
      valoresAnteriores: null,
      valoresNuevos: pickCampoData(campo),
      descripcion: `Creación de campo ${campo.nombre}`,
    });

    logger.info('configCampos.create.success', { id: campo.id, nombre: campo.nombre });
    return res.status(201).json({ success: true, message: 'Campo creado', data: formatCampoResponse(campo) });
  } catch (err) {
    logger.error('configCampos.create.error', { message: err.message, stack: err.stack, body: req.body });
    return res.status(500).json({
      success: false,
      message: 'Error al crear campo',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const updateCampo = async (req, res) => {
  try {
    const campo = await ConfiguracionCampo.findByPk(req.params.id);
    if (!campo) {
      return res.status(404).json({ success: false, message: 'Campo no encontrado' });
    }

    const { sanitized, meta } = sanitizeCampoPayload(req.body, { partial: true });
    const currentData = pickCampoData(campo);
    const mergedForValidation = { ...currentData, ...sanitized };
    const validationErrors = validateCampoPayload(mergedForValidation, { partial: false, meta });
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        error: { type: 'VALIDATION_ERROR', details: validationErrors },
      });
    }

    if (sanitized.nombre && sanitized.nombre !== campo.nombre) {
      const exists = await ConfiguracionCampo.findOne({
        where: { nombre: sanitized.nombre, id: { [Op.ne]: campo.id } },
      });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Nombre de campo ya existente' });
      }
    }

    const previousValues = pickCampoData(campo);
    const persistencePayload = prepareCampoPersistencePayload(sanitized, mergedForValidation.tipo);
    await campo.update(persistencePayload);

    await req.registrarAuditoria?.({
      tabla: 'configuracion_campos',
      registroId: campo.id,
      accion: 'UPDATE',
      valoresAnteriores: previousValues,
      valoresNuevos: pickCampoData(campo),
      descripcion: `Actualización de campo ${campo.nombre}`,
    });

    logger.info('configCampos.update.success', { id: campo.id });
    return res.json({ success: true, message: 'Campo actualizado', data: formatCampoResponse(campo) });
  } catch (err) {
    logger.error('configCampos.update.error', { message: err.message, stack: err.stack, params: req.params, body: req.body });
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar campo',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const deleteCampo = async (req, res) => {
  try {
    const campo = await ConfiguracionCampo.findByPk(req.params.id);
    if (!campo) {
      return res.status(404).json({ success: false, message: 'Campo no encontrado' });
    }

    const previousValues = pickCampoData(campo);
    await campo.destroy();

    await req.registrarAuditoria?.({
      tabla: 'configuracion_campos',
      registroId: campo.id,
      accion: 'DELETE',
      valoresAnteriores: previousValues,
      valoresNuevos: null,
      descripcion: `Eliminación de campo ${campo.nombre}`,
    });

    logger.info('configCampos.delete.success', { id: campo.id });
    return res.json({ success: true, message: 'Campo eliminado' });
  } catch (err) {
    logger.error('configCampos.delete.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar campo',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const validarValorCampo = async (req, res) => {
  try {
    const campo = await ConfiguracionCampo.findByPk(req.params.id);
    if (!campo) {
      return res.status(404).json({ success: false, message: 'Campo no encontrado' });
    }

    const valor = req.body?.valor ?? null;
    const formattedCampo = formatCampoResponse(campo);
    const errors = validateValorContraCampo(formattedCampo, valor);
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Valor inválido', error: { type: 'VALIDATION_ERROR', details: errors } });
    }
    return res.json({ success: true, data: { valid: true } });
  } catch (err) {
    logger.error('configCampos.validar.error', { message: err.message, stack: err.stack, params: req.params, body: req.body });
    return res.status(500).json({
      success: false,
      message: 'Error al validar valor de campo',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const listTemplates = async (req, res) => {
  try {
    const { activo, industria } = req.query;
    const where = {};
    const activoFilter = parseBooleanQuery(activo);
    if (activoFilter !== undefined) where.activo = activoFilter;
    if (industria) where.industria = { [Op.iLike]: `%${industria}%` };

    const templates = await TemplateIndustria.findAll({ where, order: [['nombre', 'ASC']] });
    return res.json({ success: true, data: templates.map(formatTemplateResponse) });
  } catch (err) {
    logger.error('configTemplates.list.error', { message: err.message, stack: err.stack, query: req.query });
    return res.status(500).json({
      success: false,
      message: 'Error al listar templates',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await TemplateIndustria.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }
    return res.json({ success: true, data: formatTemplateResponse(template) });
  } catch (err) {
    logger.error('configTemplates.get.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener template',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const getTemplateByCodigo = async (req, res) => {
  try {
    const codigo = String(req.params.codigo || '').toUpperCase();
    const template = await TemplateIndustria.findOne({ where: { codigo } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }
    return res.json({ success: true, data: formatTemplateResponse(template) });
  } catch (err) {
    logger.error('configTemplates.getByCodigo.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener template por código',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { sanitized, meta } = sanitizeTemplatePayload(req.body, { partial: false });
    const validationErrors = validateTemplatePayload(sanitized, { partial: false, meta });
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        error: { type: 'VALIDATION_ERROR', details: validationErrors },
      });
    }

    const codigoExists = await TemplateIndustria.findOne({ where: { codigo: sanitized.codigo } });
    if (codigoExists) {
      return res.status(409).json({ success: false, message: 'Código de template ya existente' });
    }

    const template = await TemplateIndustria.create(sanitized);

    await req.registrarAuditoria?.({
      tabla: 'templates_industria',
      registroId: template.id,
      accion: 'CREATE',
      valoresAnteriores: null,
      valoresNuevos: formatTemplateResponse(template),
      descripcion: `Creación de template ${template.codigo}`,
    });

    logger.info('configTemplates.create.success', { id: template.id, codigo: template.codigo });
    return res.status(201).json({ success: true, message: 'Template creado', data: formatTemplateResponse(template) });
  } catch (err) {
    logger.error('configTemplates.create.error', { message: err.message, stack: err.stack, body: req.body });
    return res.status(500).json({
      success: false,
      message: 'Error al crear template',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await TemplateIndustria.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    const { sanitized, meta } = sanitizeTemplatePayload(req.body, { partial: true });
    const currentData = formatTemplateResponse(template);
    const mergedForValidation = { ...currentData, ...sanitized };
    const validationMeta = {
      camposConfigInvalido: meta.camposConfigInvalido || false,
      camposMeta: Array.isArray(meta.camposMeta) && meta.camposMeta.length
        ? meta.camposMeta
        : Array.isArray(mergedForValidation.campos_config)
          ? mergedForValidation.campos_config.map(() => ({}))
          : [],
    };

    const validationErrors = validateTemplatePayload(mergedForValidation, { partial: false, meta: validationMeta });
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        error: { type: 'VALIDATION_ERROR', details: validationErrors },
      });
    }

    if (sanitized.codigo && sanitized.codigo !== template.codigo) {
      const exists = await TemplateIndustria.findOne({
        where: { codigo: sanitized.codigo, id: { [Op.ne]: template.id } },
      });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Código de template ya existente' });
      }
    }

    const previousValues = formatTemplateResponse(template);
    await template.update(pruneUndefined(sanitized));

    await req.registrarAuditoria?.({
      tabla: 'templates_industria',
      registroId: template.id,
      accion: 'UPDATE',
      valoresAnteriores: previousValues,
      valoresNuevos: formatTemplateResponse(template),
      descripcion: `Actualización de template ${template.codigo}`,
    });

    logger.info('configTemplates.update.success', { id: template.id, codigo: template.codigo });
    return res.json({ success: true, message: 'Template actualizado', data: formatTemplateResponse(template) });
  } catch (err) {
    logger.error('configTemplates.update.error', { message: err.message, stack: err.stack, params: req.params, body: req.body });
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar template',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await TemplateIndustria.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    const previousValues = formatTemplateResponse(template);
    await template.destroy();

    await req.registrarAuditoria?.({
      tabla: 'templates_industria',
      registroId: template.id,
      accion: 'DELETE',
      valoresAnteriores: previousValues,
      valoresNuevos: null,
      descripcion: `Eliminación de template ${template.codigo}`,
    });

    logger.info('configTemplates.delete.success', { id: template.id, codigo: template.codigo });
    return res.json({ success: true, message: 'Template eliminado' });
  } catch (err) {
    logger.error('configTemplates.delete.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar template',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};

export const aplicarTemplate = async (req, res) => {
  const transaction = await sequelize.transaction();
  const auditoriaEntries = [];
  try {
    const codigo = String(req.params.codigo || '').toUpperCase();
    const template = await TemplateIndustria.findOne({ where: { codigo }, transaction, lock: transaction.LOCK.UPDATE });
    if (!template) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    const templateData = formatTemplateResponse(template);
    const camposConfig = Array.isArray(templateData.campos_config) ? templateData.campos_config : [];
    if (!camposConfig.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Template no posee campos configurados' });
    }

    const validationErrors = [];
    camposConfig.forEach((campoConfig) => {
      const { sanitized, meta } = sanitizeCampoPayload(campoConfig, { partial: false });
      const errors = validateCampoPayload(sanitized, { partial: false, meta });
      if (errors.length) {
        validationErrors.push({ nombre: campoConfig.nombre, errores: errors });
      }
    });

    if (validationErrors.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validación fallida en campos del template',
        error: { type: 'VALIDATION_ERROR', details: validationErrors },
      });
    }

    const camposCreados = [];
    const camposActualizados = [];

    for (const campoConfig of camposConfig) {
      const { sanitized } = sanitizeCampoPayload(campoConfig, { partial: false });
      const persistencePayload = prepareCampoPersistencePayload(sanitized, sanitized.tipo);
      const existing = await ConfiguracionCampo.findOne({
        where: { nombre: sanitized.nombre },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existing) {
        const previousValues = pickCampoData(existing);
        await existing.update(persistencePayload, { transaction });
        camposActualizados.push(existing.nombre);
        auditoriaEntries.push({
          tabla: 'configuracion_campos',
          registroId: existing.id,
          accion: 'UPDATE',
          valoresAnteriores: previousValues,
          valoresNuevos: pickCampoData(existing),
          descripcion: `Actualización por template ${template.codigo}`,
        });
      } else {
        const created = await ConfiguracionCampo.create(persistencePayload, { transaction });
        camposCreados.push(created.nombre);
        auditoriaEntries.push({
          tabla: 'configuracion_campos',
          registroId: created.id,
          accion: 'CREATE',
          valoresAnteriores: null,
          valoresNuevos: pickCampoData(created),
          descripcion: `Creación por template ${template.codigo}`,
        });
      }
    }

    await transaction.commit();

    for (const entry of auditoriaEntries) {
      await req.registrarAuditoria?.(entry);
    }

    logger.info('configTemplates.apply.success', {
      codigo,
      creados: camposCreados.length,
      actualizados: camposActualizados.length,
    });

    return res.json({
      success: true,
      message: `Template ${codigo} aplicado`,
      data: {
        template: templateData,
        camposCreados,
        camposActualizados,
      },
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('configTemplates.apply.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({
      success: false,
      message: 'Error al aplicar template',
      error: { type: 'INTERNAL_ERROR', details: err.message },
    });
  }
};
