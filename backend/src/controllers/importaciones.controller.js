import { Op } from 'sequelize';
import { writeToString } from '@fast-csv/format';
import ExcelJS from 'exceljs';
import { sequelize } from '../config/database.js';
import { Producto, ConfiguracionCampo, TemplateIndustria } from '../models/index.js';
import {
  parseDataFile,
  guessDefaultProductoMapping,
  buildRecordsFromMapping,
} from '../utils/dataImport.utils.js';
import { sanitizeProductoPayload, validateProductoPayload } from '../validators/productos.validator.js';
import logger from '../utils/logger.js';

const MAX_PREVIEW_ROWS = 20;

const BASE_EXPORT_FIELDS = [
  { key: 'ID', header: 'ID', width: 10 },
  { key: 'Codigo', header: 'Código', width: 18 },
  { key: 'Nombre', header: 'Nombre', width: 28 },
  { key: 'Descripcion', header: 'Descripción', width: 36 },
  { key: 'CategoriaId', header: 'Categoría ID', width: 16 },
  { key: 'ProveedorId', header: 'Proveedor ID', width: 16 },
  { key: 'StockActual', header: 'Stock Actual', width: 14 },
  { key: 'StockMinimo', header: 'Stock Mínimo', width: 14 },
  { key: 'Precio', header: 'Precio', width: 12 },
  { key: 'Activo', header: 'Activo', width: 12 },
  { key: 'CreadoEn', header: 'Creado En', width: 20 },
  { key: 'ActualizadoEn', header: 'Actualizado En', width: 20 },
];

const normalizeNumber = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const BASE_IMPORT_TEMPLATE_FIELDS = [
  { key: 'codigo', header: 'Código', sample: 'SKU-001' },
  { key: 'nombre', header: 'Nombre', sample: 'Producto de ejemplo' },
  { key: 'descripcion', header: 'Descripción', sample: 'Descripción breve del producto' },
  { key: 'categoria_id', header: 'Categoría ID', sample: '1' },
  { key: 'proveedor_id', header: 'Proveedor ID', sample: '1' },
  { key: 'precio', header: 'Precio', sample: '0' },
  { key: 'stock_actual', header: 'Stock Actual', sample: '0' },
  { key: 'stock_minimo', header: 'Stock Mínimo', sample: '0' },
  { key: 'activo', header: 'Activo', sample: 'true' },
];

const SAMPLE_DATE = new Date().toISOString().split('T')[0];

const buildSampleValueForCampo = (campo = {}) => {
  if (campo.valor_default !== undefined && campo.valor_default !== null && campo.valor_default !== '') {
    return String(campo.valor_default);
  }

  const firstOptionValue = Array.isArray(campo.opciones) && campo.opciones.length
    ? String(campo.opciones[0].value ?? campo.opciones[0].label ?? '')
    : '';

  switch (campo.tipo) {
    case 'boolean':
      return 'true';
    case 'fecha':
      return SAMPLE_DATE;
    case 'numero':
    case 'decimal':
      if (campo.validaciones && typeof campo.validaciones.min !== 'undefined') {
        return String(campo.validaciones.min);
      }
      return '0';
    case 'select':
      return firstOptionValue || 'opcion_1';
    case 'multi_select': {
      if (Array.isArray(campo.opciones) && campo.opciones.length) {
        const values = campo.opciones.slice(0, 2).map((option) => option.value ?? option.label).filter(Boolean);
        return values.join(', ');
      }
      return 'valor_1, valor_2';
    }
    case 'color':
      return '#000000';
    case 'texto_largo':
      return `Detalle ${campo.nombre ?? 'campo'}`;
    default:
      return `Valor ${campo.nombre ?? 'campo'}`;
  }
};

const buildTemplateColumns = (template) => {
  const baseColumns = BASE_IMPORT_TEMPLATE_FIELDS.map((field) => ({ ...field }));
  const campos = Array.isArray(template?.campos_config) ? template.campos_config : [];

  campos
    .filter((campo) => campo && campo.nombre)
    .forEach((campo) => {
      baseColumns.push({
        key: campo.nombre,
        header: campo.etiqueta || campo.nombre,
        sample: buildSampleValueForCampo(campo),
      });
    });

  const sampleRow = baseColumns.reduce((acc, column) => ({
    ...acc,
    [column.key]: column.sample ?? '',
  }), {});

  return { columns: baseColumns, sampleRow };
};

const parseDynamicValueForImport = (campo, rawValue) => {
  if (rawValue === undefined || rawValue === null) return null;
  if (typeof rawValue === 'string' && rawValue.trim().length === 0) return null;

  switch (campo?.tipo) {
    case 'boolean': {
      const boolValue = normalizeDynamicBoolean(rawValue);
      return boolValue === null ? null : boolValue;
    }
    case 'numero':
    case 'decimal': {
      const numberValue = Number(rawValue);
      return Number.isNaN(numberValue) ? null : numberValue;
    }
    case 'fecha': {
      const date = new Date(rawValue);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    case 'multi_select': {
      if (Array.isArray(rawValue)) {
        return rawValue.map((value) => (typeof value === 'string' ? value.trim() : value)).filter((value) => value !== '' && value !== null && value !== undefined);
      }
      return String(rawValue)
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    }
    case 'select':
    case 'texto':
    case 'texto_largo':
    case 'color':
    default:
      return typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  }
};

const buildProductoPersistencePayload = (sanitized) => ({
  codigo: sanitized.codigo?.trim() ?? '',
  nombre: sanitized.nombre ?? '',
  descripcion: sanitized.descripcion ?? null,
  categoria_id: sanitized.categoria_id === undefined || Number.isNaN(sanitized.categoria_id)
    ? null
    : sanitized.categoria_id,
  proveedor_id: sanitized.proveedor_id === undefined || Number.isNaN(sanitized.proveedor_id)
    ? null
    : sanitized.proveedor_id,
  stock_actual: normalizeNumber(sanitized.stock_actual, 0),
  stock_minimo: normalizeNumber(sanitized.stock_minimo, 0),
  precio: normalizeNumber(sanitized.precio, 0),
  atributos_personalizados: sanitized.atributos_personalizados ?? null,
  activo: typeof sanitized.activo === 'boolean' ? sanitized.activo : true,
});

export const previewProductosImport = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'El archivo es requerido' });
    }

    const parsed = await parseDataFile(file.buffer, file.originalname);
    const mapping = guessDefaultProductoMapping(parsed.headers || []);
    const records = buildRecordsFromMapping(parsed.rows || [], mapping);

    const preview = records.slice(0, MAX_PREVIEW_ROWS).map((row) => {
      const sanitized = sanitizeProductoPayload(row.record ?? {}, { partial: false });
      const errors = validateProductoPayload(sanitized, { partial: false });
      return {
        index: row.index,
        values: buildProductoPersistencePayload(sanitized),
        errors,
      };
    });

    const requiredFields = ['codigo', 'nombre'];
    const missingRequired = requiredFields.filter((field) => !mapping[field]);

    return res.json({
      success: true,
      data: {
        filename: file.originalname,
        size: file.size,
        extension: parsed.extension,
        totalRows: records.length,
        headers: parsed.headers,
        suggestedMapping: mapping,
        missingRequired,
        preview,
      },
    });
  } catch (err) {
    logger.error('import.preview.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: err.message || 'Error al procesar el archivo', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

const parseListParam = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const selectBaseFields = (columnsParam) => {
  const requested = parseListParam(columnsParam).map((item) => item.toLowerCase());
  if (!requested.length) return BASE_EXPORT_FIELDS;
  const selected = BASE_EXPORT_FIELDS.filter((field) => requested.includes(field.key.toLowerCase()));
  return selected.length ? selected : BASE_EXPORT_FIELDS;
};

const selectDynamicCampos = (campos, param, { explicit = false } = {}) => {
  const hasParam = typeof param !== 'undefined' && param !== null;
  if (!explicit && !hasParam) {
    return campos;
  }

  const requested = parseListParam(param).map((item) => item.toLowerCase());
  if (!requested.length) {
    return explicit || hasParam ? [] : campos;
  }

  const selected = campos.filter((campo) => requested.includes(campo.nombre.toLowerCase()));
  if (selected.length) return selected;

  return explicit || hasParam ? [] : campos;
};

const ensureValidMapping = (mapping = {}) => {
  if (!mapping.codigo || !mapping.nombre) {
    throw new Error('El mapeo debe incluir al menos "codigo" y "nombre"');
  }
};

export const confirmProductosImport = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'El archivo es requerido' });
  }

  let mapping;
  try {
    mapping = req.body?.mapping ? JSON.parse(req.body.mapping) : {};
  } catch (err) {
    return res.status(400).json({ success: false, message: 'mapping debe ser un JSON válido' });
  }

  const mode = req.body?.mode || req.body?.modo || 'upsert';

  try {
    const parsed = await parseDataFile(file.buffer, file.originalname);
    const effectiveMapping = Object.keys(mapping || {}).length ? mapping : guessDefaultProductoMapping(parsed.headers || []);
    ensureValidMapping(effectiveMapping);

    const dynamicCampos = await ConfiguracionCampo.findAll({
      where: { aplica_a: 'productos', activo: true },
    }).then((items) => items.map((item) => item.get({ plain: true })));

    const dynamicCamposMap = new Map(dynamicCampos.map((campo) => [campo.nombre, campo]));

    const records = buildRecordsFromMapping(parsed.rows || [], effectiveMapping);
    if (!records.length) {
      return res.status(400).json({ success: false, message: 'El archivo no contiene filas válidas para importar' });
    }

    const transaction = await sequelize.transaction();
    try {
      const summary = {
        total: records.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      for (const row of records) {
        const rawRecord = row.record ?? {};
        const dynamicRawValues = {};
        Object.entries(rawRecord).forEach(([key, value]) => {
          if (dynamicCamposMap.has(key)) {
            dynamicRawValues[key] = value;
          }
        });

        const sanitized = sanitizeProductoPayload(rawRecord, { partial: false });
        const errors = validateProductoPayload(sanitized, { partial: false });

        if (errors.length) {
          summary.errors.push({ index: row.index, codigo: row.record?.codigo ?? null, errors });
          summary.skipped += 1;
          continue;
        }

        const payload = buildProductoPersistencePayload(sanitized);

        if (Object.keys(dynamicRawValues).length) {
          const dynamicParsed = {};
          Object.entries(dynamicRawValues).forEach(([key, value]) => {
            const campo = dynamicCamposMap.get(key);
            const parsedValue = parseDynamicValueForImport(campo, value);
            if (parsedValue !== null && parsedValue !== undefined && parsedValue !== '') {
              dynamicParsed[key] = parsedValue;
            } else if (campo?.obligatorio) {
              dynamicParsed[key] = null;
            }
          });

          if (Object.keys(dynamicParsed).length) {
            payload.atributos_personalizados = {
              ...(payload.atributos_personalizados ?? {}),
              ...dynamicParsed,
            };
          }
        }

        if (!payload.codigo) {
          summary.errors.push({ index: row.index, codigo: null, errors: ['Código es requerido'] });
          summary.skipped += 1;
          continue;
        }

        const existing = await Producto.findOne({ where: { codigo: payload.codigo }, transaction });

        if (existing) {
          if (mode === 'create_only') {
            summary.skipped += 1;
            summary.errors.push({ index: row.index, codigo: payload.codigo, errors: ['Producto existente (modo create_only)'] });
            continue;
          }

          const previousValues = existing.get({ plain: true });

          if (payload.atributos_personalizados) {
            payload.atributos_personalizados = {
              ...(previousValues.atributos_personalizados ?? {}),
              ...payload.atributos_personalizados,
            };
          }

          await existing.update(payload, { transaction });
          summary.updated += 1;

          await req.registrarAuditoria?.({
            tabla: 'productos',
            registroId: existing.id,
            accion: 'UPDATE',
            valoresAnteriores: previousValues,
            valoresNuevos: existing.get({ plain: true }),
            descripcion: `Importación de producto ${payload.codigo}`,
          });
        } else {
          if (mode === 'update_only') {
            summary.skipped += 1;
            summary.errors.push({ index: row.index, codigo: payload.codigo, errors: ['Producto inexistente (modo update_only)'] });
            continue;
          }

          const created = await Producto.create(payload, { transaction });
          summary.created += 1;

          await req.registrarAuditoria?.({
            tabla: 'productos',
            registroId: created.id,
            accion: 'CREATE',
            valoresAnteriores: null,
            valoresNuevos: created.get({ plain: true }),
            descripcion: `Importación de producto ${payload.codigo}`,
          });
        }
      }

      await transaction.commit();
      logger.info('import.confirm.success', {
        mode,
        total: summary.total,
        created: summary.created,
        updated: summary.updated,
        skipped: summary.skipped,
        errors: summary.errors.length,
      });

      return res.json({ success: true, data: summary, message: 'Importación completada' });
    } catch (err) {
      await transaction.rollback();
      logger.error('import.confirm.error', { message: err.message, stack: err.stack });
      return res.status(500).json({ success: false, message: err.message || 'Error al aplicar la importación', error: { type: 'INTERNAL_ERROR', details: err.message } });
    }
  } catch (err) {
    logger.error('import.confirm.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: err.message || 'Error al procesar la importación', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

const buildNumberFilter = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const buildProductoFilters = (query = {}) => {
  const {
    search,
    categoria_id,
    proveedor_id,
    activo,
    min_stock,
    max_stock,
    min_price,
    max_price,
  } = query;

  const where = {};

  if (search) {
    const likeValue = `%${String(search).trim()}%`;
    where[Op.or] = [
      { nombre: { [Op.iLike]: likeValue } },
      { codigo: { [Op.iLike]: likeValue } },
      { descripcion: { [Op.iLike]: likeValue } },
    ];
  }

  const categoria = Number(categoria_id);
  if (!Number.isNaN(categoria) && categoria > 0) {
    where.categoria_id = categoria;
  }

  const proveedor = Number(proveedor_id);
  if (!Number.isNaN(proveedor) && proveedor > 0) {
    where.proveedor_id = proveedor;
  }

  if (typeof activo !== 'undefined') {
    const normalized = String(activo).toLowerCase();
    if (['true', 'false'].includes(normalized)) {
      where.activo = normalized === 'true';
    }
  }

  const minStockValue = buildNumberFilter(min_stock);
  const maxStockValue = buildNumberFilter(max_stock);
  if (minStockValue !== undefined || maxStockValue !== undefined) {
    where.stock_actual = { ...where.stock_actual };
    if (minStockValue !== undefined) where.stock_actual[Op.gte] = minStockValue;
    if (maxStockValue !== undefined) where.stock_actual[Op.lte] = maxStockValue;
  }

  const minPriceValue = buildNumberFilter(min_price);
  const maxPriceValue = buildNumberFilter(max_price);
  if (minPriceValue !== undefined || maxPriceValue !== undefined) {
    where.precio = { ...where.precio };
    if (minPriceValue !== undefined) where.precio[Op.gte] = minPriceValue;
    if (maxPriceValue !== undefined) where.precio[Op.lte] = maxPriceValue;
  }

  return where;
};

const fetchProductosForExport = async (query = {}) => {
  const where = buildProductoFilters(query);
  const sortField = String(query.sort_by || '').toLowerCase();
  const sortDirection = String(query.sort_dir || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const sortableFields = new Set(['id', 'nombre', 'codigo', 'stock_actual', 'precio', 'created_at', 'updated_at']);
  const orderField = sortableFields.has(sortField) ? sortField : 'nombre';

  return Producto.findAll({
    where,
    order: [[orderField, sortDirection]],
  });
};

const normalizeDynamicBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'sí', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return null;
};

const formatDynamicValue = (campo, rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === '') return '';
  switch (campo.tipo) {
    case 'boolean': {
      const boolValue = normalizeDynamicBoolean(rawValue);
      if (boolValue === null) return String(rawValue);
      return boolValue ? 'Sí' : 'No';
    }
    case 'fecha': {
      const date = new Date(rawValue);
      if (Number.isNaN(date.getTime())) return String(rawValue);
      return date.toISOString().split('T')[0];
    }
    case 'multi_select': {
      const values = Array.isArray(rawValue) ? rawValue : String(rawValue).split(',').map((v) => v.trim()).filter(Boolean);
      if (!Array.isArray(campo.opciones) || !campo.opciones.length) {
        return values.join(', ');
      }
      const labels = values.map((value) => campo.opciones.find((option) => option.value === value)?.label ?? value);
      return labels.join(', ');
    }
    case 'select': {
      if (Array.isArray(campo.opciones) && campo.opciones.length) {
        return campo.opciones.find((option) => option.value === rawValue)?.label ?? String(rawValue);
      }
      return String(rawValue);
    }
    default:
      return String(rawValue);
  }
};

const serializeProductoForExport = (producto, campos = [], options = {}) => {
  const { baseKeys, useCampoNombreAsKey = false } = options;
  const plain = producto?.get ? producto.get({ plain: true }) : producto ?? {};
  const base = {
    ID: plain.id,
    Codigo: plain.codigo,
    Nombre: plain.nombre,
    Descripcion: plain.descripcion ?? '',
    CategoriaId: plain.categoria_id ?? '',
    ProveedorId: plain.proveedor_id ?? '',
    StockActual: Number(plain.stock_actual ?? 0),
    StockMinimo: Number(plain.stock_minimo ?? 0),
    Precio: Number(plain.precio ?? 0),
    Activo: plain.activo ? 'Sí' : 'No',
    CreadoEn: plain.created_at ? new Date(plain.created_at).toISOString() : '',
    ActualizadoEn: plain.updated_at ? new Date(plain.updated_at).toISOString() : '',
  };
  const result = {};
  const keysToInclude = Array.isArray(baseKeys) && baseKeys.length ? baseKeys : Object.keys(base);
  keysToInclude.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      result[key] = base[key];
    }
  });
  const atributos = plain.atributos_personalizados ?? {};
  campos.forEach((campo) => {
    const key = useCampoNombreAsKey ? campo.nombre : (campo.etiqueta || campo.nombre);
    const rawValue = atributos?.[campo.nombre];
    result[key] = formatDynamicValue(campo, rawValue);
  });
  return result;
};

export const exportProductosCSV = async (req, res) => {
  try {
    const baseFields = selectBaseFields(req.query.columns);
    const baseKeys = baseFields.map((field) => field.key);
    const dynamicParam = req.query.dynamic_columns;
    const hasDynamicParam = Object.prototype.hasOwnProperty.call(req.query, 'dynamic_columns');

    const [rows, campos] = await Promise.all([
      fetchProductosForExport(req.query),
      ConfiguracionCampo.findAll({
        where: { aplica_a: 'productos', activo: true },
        order: [['grupo', 'ASC'], ['orden', 'ASC'], ['id', 'ASC']],
      }).then((items) => items.map((item) => item.get({ plain: true }))),
    ]);

    const selectedCampos = selectDynamicCampos(campos, dynamicParam, { explicit: hasDynamicParam });

    const data = rows.map((row) => serializeProductoForExport(row, selectedCampos, {
      baseKeys,
      useCampoNombreAsKey: false,
    }));

    const csv = await writeToString(data, {
      headers: true,
      writeBOM: true,
      delimiter: ',',
    });

    await req.registrarAuditoria?.({
      tabla: 'productos',
      registroId: 'export_csv',
      accion: 'EXPORT',
      valoresAnteriores: null,
      valoresNuevos: null,
      descripcion: 'Exportación de productos a CSV',
      metadatos: { filtros: req.query },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="productos_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    logger.error('export.csv.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al exportar productos (CSV)', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const exportProductosExcel = async (req, res) => {
  try {
    const baseFields = selectBaseFields(req.query.columns);
    const baseKeys = baseFields.map((field) => field.key);
    const dynamicParam = req.query.dynamic_columns;
    const hasDynamicParam = Object.prototype.hasOwnProperty.call(req.query, 'dynamic_columns');

    const [rows, campos] = await Promise.all([
      fetchProductosForExport(req.query),
      ConfiguracionCampo.findAll({
        where: { aplica_a: 'productos', activo: true },
        order: [['grupo', 'ASC'], ['orden', 'ASC'], ['id', 'ASC']],
      }).then((items) => items.map((item) => item.get({ plain: true }))),
    ]);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    const selectedCampos = selectDynamicCampos(campos, dynamicParam, { explicit: hasDynamicParam });

    const dynamicColumns = selectedCampos.map((campo) => ({
      header: campo.etiqueta || campo.nombre,
      key: campo.nombre,
      width: Math.max(18, Math.min(40, (campo.etiqueta || campo.nombre).length + 8)),
    }));

    worksheet.columns = [
      ...baseFields.map((field) => ({ header: field.header, key: field.key, width: field.width })),
      ...dynamicColumns,
    ];

    rows
      .map((row) => serializeProductoForExport(row, selectedCampos, {
        baseKeys,
        useCampoNombreAsKey: true,
      }))
      .forEach((record) => {
        worksheet.addRow(record);
      });

    const buffer = await workbook.xlsx.writeBuffer();

    await req.registrarAuditoria?.({
      tabla: 'productos',
      registroId: 'export_excel',
      accion: 'EXPORT',
      valoresAnteriores: null,
      valoresNuevos: null,
      descripcion: 'Exportación de productos a Excel',
      metadatos: { filtros: req.query },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="productos_${new Date().toISOString().split('T')[0]}.xlsx"`);
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    logger.error('export.excel.error', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Error al exportar productos (Excel)', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const downloadProductosTemplateCSV = async (req, res) => {
  try {
    const codigo = String(req.params.codigo || '').toUpperCase();
    const template = await TemplateIndustria.findOne({ where: { codigo } });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    const templateData = template.get({ plain: true });
    const { columns, sampleRow } = buildTemplateColumns(templateData);

    const headers = columns.map((column) => ({ id: column.key, title: column.header }));

    const csv = await writeToString([sampleRow], {
      headers,
      writeHeaders: true,
      writeBOM: true,
      delimiter: ',',
    });

    await req.registrarAuditoria?.({
      tabla: 'templates_industria',
      registroId: template.id,
      accion: 'EXPORT',
      valoresAnteriores: null,
      valoresNuevos: null,
      descripcion: `Descarga template ${template.codigo} (CSV)`,
      metadatos: { formato: 'csv' },
    });

    const filename = `template_${template.codigo.toLowerCase()}_productos.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    logger.error('templates.download.csv.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({ success: false, message: 'Error al descargar template (CSV)', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const downloadProductosTemplateExcel = async (req, res) => {
  try {
    const codigo = String(req.params.codigo || '').toUpperCase();
    const template = await TemplateIndustria.findOne({ where: { codigo } });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    const templateData = template.get({ plain: true });
    const { columns, sampleRow } = buildTemplateColumns(templateData);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventarios ASD';
    const worksheet = workbook.addWorksheet(templateData.nombre || templateData.codigo || 'Template');

    worksheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: Math.max(16, Math.min(40, (column.header || '').length + 6)),
    }));

    worksheet.addRow(sampleRow);
    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    await req.registrarAuditoria?.({
      tabla: 'templates_industria',
      registroId: template.id,
      accion: 'EXPORT',
      valoresAnteriores: null,
      valoresNuevos: null,
      descripcion: `Descarga template ${template.codigo} (Excel)`,
      metadatos: { formato: 'excel' },
    });

    const filename = `template_${template.codigo.toLowerCase()}_productos.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    logger.error('templates.download.excel.error', { message: err.message, stack: err.stack, params: req.params });
    return res.status(500).json({ success: false, message: 'Error al descargar template (Excel)', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const __testables = {
  formatDynamicValue,
  normalizeDynamicBoolean,
  serializeProductoForExport,
  selectDynamicCampos,
  buildTemplateColumns,
  buildSampleValueForCampo,
  parseDynamicValueForImport,
};
