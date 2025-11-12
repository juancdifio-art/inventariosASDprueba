import { extname } from 'path';
import ExcelJS from 'exceljs';
import { parseString } from 'fast-csv';

const SUPPORTED_EXTENSIONS = new Set(['.csv', '.tsv', '.txt', '.xlsx', '.xlsm', '.xlsb']);

const DEFAULT_DELIMITER = {
  '.csv': ',',
  '.tsv': '\t',
  '.txt': ',',
};

const isValueEmpty = (value) => value === undefined || value === null || value === '';

const normalizeHeader = (header) => {
  if (!header) return null;
  return String(header)
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
};

export const guessDefaultProductoMapping = (headers = []) => {
  const mapping = {};
  const normalized = headers.map((header) => normalizeHeader(header));
  const findHeader = (candidates) => {
    const set = Array.isArray(candidates) ? candidates : [candidates];
    const index = normalized.findIndex((header) => header && set.includes(header));
    return index >= 0 ? headers[index] : null;
  };

  mapping.codigo = findHeader(['codigo', 'sku', 'codigo_producto']);
  mapping.nombre = findHeader(['nombre', 'productonombre', 'descripcion_corta']);
  mapping.descripcion = findHeader(['descripcion', 'detalle', 'descripcion_larga']);
  mapping.categoria_id = findHeader(['categoria_id', 'id_categoria']);
  mapping.proveedor_id = findHeader(['proveedor_id', 'id_proveedor']);
  mapping.stock_actual = findHeader(['stock', 'stock_actual', 'inventario_actual']);
  mapping.stock_minimo = findHeader(['stock_minimo', 'min_stock', 'stock_min']);
  mapping.precio = findHeader(['precio', 'precio_unitario', 'precio_lista']);
  mapping.activo = findHeader(['activo', 'habilitado', 'estado']);

  return mapping;
};

const sanitizeRowObject = (row = {}) => {
  const sanitized = {};
  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeHeader(key);
    if (!normalizedKey) return;
    const trimmed = typeof value === 'string' ? value.trim() : value;
    sanitized[normalizedKey] = trimmed;
  });
  return sanitized;
};

export async function parseDataFile(buffer, filename) {
  if (!buffer || !filename) {
    throw new Error('Archivo inválido');
  }

  const extension = extname(filename).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error(`Formato no soportado (${extension || 'desconocido'})`);
  }

  if (extension === '.xlsx' || extension === '.xlsm' || extension === '.xlsb') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('El archivo no contiene hojas válidas');
    }

    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value ?? '').trim());
    });

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const values = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (!header) return;
        values[header] = cell.value ?? '';
      });
      const sanitized = sanitizeRowObject(values);
      if (Object.values(sanitized).some((value) => !isValueEmpty(value))) {
        rows.push({ index: rowNumber, raw: values, sanitized });
      }
    });

    return {
      extension,
      headers,
      rows,
    };
  }

  const delimiter = DEFAULT_DELIMITER[extension] ?? ',';
  const text = buffer.toString('utf8');
  const headers = [];
  const rows = [];

  await new Promise((resolve, reject) => {
    parseString(text, {
      headers: true,
      trim: true,
      ignoreEmpty: true,
      delimiter,
    })
      .on('headers', (parsedHeaders) => {
        parsedHeaders.forEach((header) => headers.push(header));
      })
      .on('data', (data) => {
        const sanitized = sanitizeRowObject(data);
        if (Object.values(sanitized).some((value) => !isValueEmpty(value))) {
          rows.push({ raw: data, sanitized });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  return {
    extension,
    headers,
    rows,
  };
}

export function buildRecordsFromMapping(rows = [], mapping = {}) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => {
    const destination = {};
    Object.entries(mapping || {}).forEach(([field, header]) => {
      if (!header) return;
      const normalizedHeader = normalizeHeader(header);
      const sanitizedValue = row.sanitized?.[normalizedHeader];
      destination[field] = sanitizedValue ?? null;
    });
    return { index: row.index ?? index + 2, record: destination, raw: row.raw };
  });
}
