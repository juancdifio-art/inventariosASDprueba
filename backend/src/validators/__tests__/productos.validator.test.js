import { sanitizeProductoPayload, validateProductoPayload } from '../productos.validator.js';

describe('productos.validator', () => {
  it('sanitizes full payload with defaults', () => {
    const sanitized = sanitizeProductoPayload({
      codigo: '  P-001  ',
      nombre: '  Producto Demo  ',
      descripcion: '  desc  ',
      categoria_id: '10',
      proveedor_id: '5',
      stock_actual: '12.5',
      stock_minimo: '3',
      precio: '55.30',
      atributos_personalizados: { color: 'azul' },
      activo: 'false',
    });

    expect(sanitized).toMatchObject({
      codigo: 'P-001',
      nombre: 'Producto Demo',
      descripcion: 'desc',
      categoria_id: 10,
      proveedor_id: 5,
      stock_actual: 12.5,
      stock_minimo: 3,
      precio: 55.3,
      atributos_personalizados: { color: 'azul' },
      activo: false,
    });
  });

  it('validates required fields and non-negative numbers', () => {
    const errors = validateProductoPayload({
      codigo: '   ',
      stock_actual: -1,
      stock_minimo: 'abc',
      precio: NaN,
      atributos_personalizados: [],
    });

    expect(errors).toEqual(expect.arrayContaining([
      'Código es requerido',
      'Nombre es requerido',
      'stock_actual debe ser un número mayor o igual a 0',
      'stock_minimo debe ser un número',
      'precio debe ser un número',
      'atributos_personalizados debe ser un objeto o null',
    ]));
  });

  it('allows partial updates without mandatory fields', () => {
    const sanitized = sanitizeProductoPayload({ precio: 100 }, { partial: true });
    const errors = validateProductoPayload(sanitized, { partial: true });
    expect(errors).toHaveLength(0);
    expect(sanitized.precio).toBe(100);
  });

  it('detects invalid categoria/proveedor and mantiene atributos null en updates parciales', () => {
    const payload = sanitizeProductoPayload({
      categoria_id: 'abc',
      proveedor_id: 'xyz',
      atributos_personalizados: [],
      stock_actual: -10,
    }, { partial: true });

    expect(payload.atributos_personalizados).toBeNull();

    const errors = validateProductoPayload(payload, { partial: true });

    expect(errors).toEqual(expect.arrayContaining([
      'categoria_id debe ser numérico o null',
      'proveedor_id debe ser numérico o null',
      'stock_actual debe ser un número mayor o igual a 0',
    ]));
  });
});
