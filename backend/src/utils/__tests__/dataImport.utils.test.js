import { jest } from '@jest/globals';
import {
  guessDefaultProductoMapping,
  parseDataFile,
  buildRecordsFromMapping,
} from '../dataImport.utils.js';

describe('dataImport.utils', () => {
  describe('guessDefaultProductoMapping', () => {
    it('mapea headers estándar correctamente', () => {
      const headers = ['codigo', 'nombre', 'descripcion', 'stock', 'precio'];
      const mapping = guessDefaultProductoMapping(headers);

      expect(mapping.codigo).toBe('codigo');
      expect(mapping.nombre).toBe('nombre');
      expect(mapping.descripcion).toBe('descripcion');
      expect(mapping.stock_actual).toBe('stock');
      expect(mapping.precio).toBe('precio');
    });

    it('mapea headers con variaciones de nombres', () => {
      const headers = ['SKU', 'nombre', 'stock_actual', 'precio_unitario'];
      const mapping = guessDefaultProductoMapping(headers);

      expect(mapping.codigo).toBe('SKU');
      expect(mapping.nombre).toBe('nombre');
      expect(mapping.stock_actual).toBe('stock_actual');
      expect(mapping.precio).toBe('precio_unitario');
    });

    it('retorna null para headers no encontrados', () => {
      const headers = ['columna_desconocida', 'otra_columna'];
      const mapping = guessDefaultProductoMapping(headers);

      expect(mapping.codigo).toBeNull();
      expect(mapping.nombre).toBeNull();
      expect(mapping.descripcion).toBeNull();
    });

    it('maneja array vacío', () => {
      const mapping = guessDefaultProductoMapping([]);

      expect(mapping.codigo).toBeNull();
      expect(mapping.nombre).toBeNull();
    });

    it('mapea categoria_id y proveedor_id', () => {
      const headers = ['categoria_id', 'id_proveedor'];
      const mapping = guessDefaultProductoMapping(headers);

      expect(mapping.categoria_id).toBe('categoria_id');
      expect(mapping.proveedor_id).toBe('id_proveedor');
    });

    it('mapea stock_minimo con variaciones', () => {
      const headers = ['min_stock', 'stock_min'];
      const mapping1 = guessDefaultProductoMapping(['min_stock']);
      const mapping2 = guessDefaultProductoMapping(['stock_min']);

      expect(mapping1.stock_minimo).toBe('min_stock');
      expect(mapping2.stock_minimo).toBe('stock_min');
    });

    it('mapea activo con variaciones', () => {
      const headers = ['habilitado', 'estado'];
      const mapping1 = guessDefaultProductoMapping(['habilitado']);
      const mapping2 = guessDefaultProductoMapping(['estado']);

      expect(mapping1.activo).toBe('habilitado');
      expect(mapping2.activo).toBe('estado');
    });
  });

  describe('parseDataFile', () => {
    it('rechaza archivo sin buffer', async () => {
      await expect(parseDataFile(null, 'file.csv')).rejects.toThrow('Archivo inválido');
    });

    it('rechaza archivo sin nombre', async () => {
      const buffer = Buffer.from('test');
      await expect(parseDataFile(buffer, null)).rejects.toThrow('Archivo inválido');
    });

    it('rechaza formato no soportado', async () => {
      const buffer = Buffer.from('test');
      await expect(parseDataFile(buffer, 'file.pdf')).rejects.toThrow('Formato no soportado');
    });

    it('parsea CSV simple correctamente', async () => {
      const csvContent = 'codigo,nombre,precio\nP-1,Producto 1,100\nP-2,Producto 2,200';
      const buffer = Buffer.from(csvContent, 'utf8');

      const result = await parseDataFile(buffer, 'productos.csv');

      expect(result.extension).toBe('.csv');
      expect(result.headers).toEqual(['codigo', 'nombre', 'precio']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].sanitized.codigo).toBe('P-1');
      expect(result.rows[1].sanitized.nombre).toBe('Producto 2');
    });

    it('parsea TSV correctamente', async () => {
      const tsvContent = 'codigo\tnombre\tprecio\nP-1\tProducto 1\t100';
      const buffer = Buffer.from(tsvContent, 'utf8');

      const result = await parseDataFile(buffer, 'productos.tsv');

      expect(result.extension).toBe('.tsv');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].sanitized.codigo).toBe('P-1');
    });

    it('ignora filas vacías en CSV', async () => {
      const csvContent = 'codigo,nombre\nP-1,Producto 1\n\n,\nP-2,Producto 2';
      const buffer = Buffer.from(csvContent, 'utf8');

      const result = await parseDataFile(buffer, 'productos.csv');

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].sanitized.codigo).toBe('P-1');
      expect(result.rows[1].sanitized.codigo).toBe('P-2');
    });

    it('normaliza headers con espacios y caracteres especiales', async () => {
      const csvContent = 'Código Producto,Nombre (ES),Precio $\nP-1,Producto,100';
      const buffer = Buffer.from(csvContent, 'utf8');

      const result = await parseDataFile(buffer, 'productos.csv');

      // normalizeHeader reemplaza espacios con _ y elimina caracteres especiales
      expect(result.rows[0].sanitized).toHaveProperty('cdigo_producto');
      expect(result.rows[0].sanitized).toHaveProperty('nombre_es');
      expect(result.rows[0].sanitized).toHaveProperty('precio_');
    });

    it('maneja valores con espacios en blanco', async () => {
      const csvContent = 'codigo,nombre\n  P-1  ,  Producto 1  ';
      const buffer = Buffer.from(csvContent, 'utf8');

      const result = await parseDataFile(buffer, 'productos.csv');

      expect(result.rows[0].sanitized.codigo).toBe('P-1');
      expect(result.rows[0].sanitized.nombre).toBe('Producto 1');
    });

    it('maneja CSV con delimitador punto y coma', async () => {
      const csvContent = 'codigo;nombre;precio\nP-1;Producto 1;100';
      const buffer = Buffer.from(csvContent, 'utf8');

      // Para CSV con ; necesitamos especificar el delimitador o usar .txt
      const result = await parseDataFile(buffer, 'productos.txt');

      expect(result.rows).toHaveLength(1);
    });

    it('maneja errores de parseo CSV', async () => {
      const invalidCsv = 'codigo,nombre\n"unclosed quote,value';
      const buffer = Buffer.from(invalidCsv, 'utf8');

      // fast-csv lanza error en CSV malformado
      await expect(parseDataFile(buffer, 'productos.csv')).rejects.toThrow();
    });

    it('parsea archivo Excel (.xlsx) correctamente', async () => {
      // Crear un workbook Excel simple con ExcelJS
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos');

      // Agregar headers
      worksheet.addRow(['codigo', 'nombre', 'precio']);
      // Agregar datos
      worksheet.addRow(['P-1', 'Producto Excel 1', 100]);
      worksheet.addRow(['P-2', 'Producto Excel 2', 200]);

      const buffer = await workbook.xlsx.writeBuffer();

      const result = await parseDataFile(buffer, 'productos.xlsx');

      expect(result.extension).toBe('.xlsx');
      expect(result.headers).toEqual(['codigo', 'nombre', 'precio']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].sanitized.codigo).toBe('P-1');
      expect(result.rows[1].sanitized.nombre).toBe('Producto Excel 2');
    });

    it('ignora filas vacías en Excel', async () => {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos');

      worksheet.addRow(['codigo', 'nombre']);
      worksheet.addRow(['P-1', 'Producto 1']);
      worksheet.addRow(['', '']); // Fila vacía
      worksheet.addRow(['P-2', 'Producto 2']);

      const buffer = await workbook.xlsx.writeBuffer();

      const result = await parseDataFile(buffer, 'productos.xlsx');

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].sanitized.codigo).toBe('P-1');
      expect(result.rows[1].sanitized.codigo).toBe('P-2');
    });

    it('rechaza Excel sin hojas válidas', async () => {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      // No agregar ninguna hoja

      const buffer = await workbook.xlsx.writeBuffer();

      await expect(parseDataFile(buffer, 'productos.xlsx')).rejects.toThrow('no contiene hojas válidas');
    });

    it('maneja archivos .xlsm y .xlsb', async () => {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos');

      worksheet.addRow(['codigo', 'nombre']);
      worksheet.addRow(['P-1', 'Producto 1']);

      const buffer = await workbook.xlsx.writeBuffer();

      const result1 = await parseDataFile(buffer, 'productos.xlsm');
      const result2 = await parseDataFile(buffer, 'productos.xlsb');

      expect(result1.extension).toBe('.xlsm');
      expect(result2.extension).toBe('.xlsb');
      expect(result1.rows).toHaveLength(1);
      expect(result2.rows).toHaveLength(1);
    });
  });

  describe('buildRecordsFromMapping', () => {
    it('construye registros desde mapping', () => {
      const rows = [
        {
          index: 2,
          raw: { codigo: 'P-1', nombre: 'Producto 1' },
          sanitized: { codigo: 'P-1', nombre: 'Producto 1' },
        },
        {
          index: 3,
          raw: { codigo: 'P-2', nombre: 'Producto 2' },
          sanitized: { codigo: 'P-2', nombre: 'Producto 2' },
        },
      ];

      const mapping = {
        codigo: 'codigo',
        nombre: 'nombre',
      };

      const records = buildRecordsFromMapping(rows, mapping);

      expect(records).toHaveLength(2);
      expect(records[0].record.codigo).toBe('P-1');
      expect(records[0].record.nombre).toBe('Producto 1');
      expect(records[0].index).toBe(2);
      expect(records[1].record.codigo).toBe('P-2');
    });

    it('normaliza headers en el mapping', () => {
      const rows = [
        {
          sanitized: { cdigo_producto: 'P-1', nombre_es: 'Producto 1' },
          raw: {},
        },
      ];

      const mapping = {
        codigo: 'Código Producto',
        nombre: 'Nombre (ES)',
      };

      const records = buildRecordsFromMapping(rows, mapping);

      expect(records[0].record.codigo).toBe('P-1');
      expect(records[0].record.nombre).toBe('Producto 1');
    });

    it('asigna null para campos no mapeados', () => {
      const rows = [
        {
          sanitized: { codigo: 'P-1' },
          raw: {},
        },
      ];

      const mapping = {
        codigo: 'codigo',
        nombre: 'nombre_inexistente',
      };

      const records = buildRecordsFromMapping(rows, mapping);

      expect(records[0].record.codigo).toBe('P-1');
      expect(records[0].record.nombre).toBeNull();
    });

    it('maneja array vacío', () => {
      const records = buildRecordsFromMapping([], {});
      expect(records).toEqual([]);
    });

    it('maneja rows no array', () => {
      const records = buildRecordsFromMapping(null, {});
      expect(records).toEqual([]);
    });

    it('genera índices automáticos si no existen', () => {
      const rows = [
        { sanitized: { codigo: 'P-1' }, raw: {} },
        { sanitized: { codigo: 'P-2' }, raw: {} },
      ];

      const mapping = { codigo: 'codigo' };
      const records = buildRecordsFromMapping(rows, mapping);

      expect(records[0].index).toBe(2); // index + 2 (header row)
      expect(records[1].index).toBe(3);
    });

    it('preserva raw data', () => {
      const rows = [
        {
          sanitized: { codigo: 'P-1' },
          raw: { 'Código Original': 'P-1', extra: 'data' },
        },
      ];

      const mapping = { codigo: 'codigo' };
      const records = buildRecordsFromMapping(rows, mapping);

      expect(records[0].raw).toEqual({ 'Código Original': 'P-1', extra: 'data' });
    });

    it('maneja mapping vacío', () => {
      const rows = [
        { sanitized: { codigo: 'P-1' }, raw: {} },
      ];

      const records = buildRecordsFromMapping(rows, {});

      expect(records[0].record).toEqual({});
    });

    it('maneja mapping null', () => {
      const rows = [
        { sanitized: { codigo: 'P-1' }, raw: {} },
      ];

      const records = buildRecordsFromMapping(rows, null);

      expect(records[0].record).toEqual({});
    });
  });
});
