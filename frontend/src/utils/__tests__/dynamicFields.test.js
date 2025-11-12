import { describe, it, expect } from 'vitest';
import {
  applyCampoDefaults,
  validateCamposValues,
  buildAtributosPayload,
} from '../dynamicFields.js';

const createCampo = (overrides = {}) => ({
  nombre: 'campo_generico',
  tipo: 'texto',
  obligatorio: false,
  activo: true,
  visible_en_listado: true,
  visible_en_detalle: true,
  ...overrides,
});

describe('dynamicFields utils', () => {
  it('applyCampoDefaults coloca valores faltantes sin sobreescribir existentes', () => {
    const groups = [
      {
        id: 'grupo-1',
        title: 'Grupo 1',
        campos: [
          createCampo({ nombre: 'codigo', valor_default: 'AUTO-001' }),
          createCampo({ nombre: 'precio', tipo: 'numero', valor_default: 15 }),
        ],
      },
    ];

    const initial = { precio: 99 };
    const result = applyCampoDefaults(groups, initial);

    expect(result).toEqual({
      codigo: 'AUTO-001',
      precio: 99,
    });
  });

  it('validateCamposValues retorna errores solo para campos con problemas', () => {
    const campos = [
      createCampo({ nombre: 'serie', obligatorio: true }),
      createCampo({ nombre: 'stock_max', tipo: 'numero' }),
      createCampo({ nombre: 'peso', tipo: 'decimal', obligatorio: false }),
    ];

    const valores = {
      serie: '   ',
      stock_max: 'no-numero',
      peso: 2.75,
    };

    const errors = validateCamposValues(campos, valores);

    expect(errors).toMatchObject({
      serie: 'Valor requerido',
      stock_max: 'Debe ser un número entero',
    });
    expect(errors).not.toHaveProperty('peso');
  });

  it('buildAtributosPayload normaliza valores y omite vacíos', () => {
    const campos = [
      createCampo({ nombre: 'serie', tipo: 'texto' }),
      createCampo({ nombre: 'es_fragil', tipo: 'boolean' }),
      createCampo({ nombre: 'capacidad', tipo: 'numero' }),
      createCampo({ nombre: 'peso', tipo: 'decimal' }),
      createCampo({
        nombre: 'etiquetas',
        tipo: 'multi_select',
        opciones: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      }),
      createCampo({ nombre: 'color_hex', tipo: 'color' }),
      createCampo({ nombre: 'observaciones', tipo: 'texto' }),
    ];

    const valores = {
      serie: 'ABC123',
      es_fragil: 'true',
      capacidad: '7',
      peso: '2.5',
      etiquetas: ['a', 'b'],
      color_hex: '#ff0000',
      observaciones: '   ',
    };

    const payload = buildAtributosPayload(campos, valores);

    expect(payload).toEqual({
      serie: 'ABC123',
      es_fragil: true,
      capacidad: 7,
      peso: 2.5,
      etiquetas: ['a', 'b'],
      color_hex: '#ff0000',
    });
  });
});
