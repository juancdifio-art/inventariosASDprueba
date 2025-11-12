import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reportesService from '../reportesService';
import api from '../../api/api';

vi.mock('../../api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('reportesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchInventoryReport', () => {
    it('obtiene reporte de inventario', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, nombre: 'Producto 1', stock_actual: 10 },
              { id: 2, nombre: 'Producto 2', stock_actual: 5 },
            ],
            resumen: {
              totalProductos: 2,
              productosBajoStock: 1,
            },
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await reportesService.fetchInventoryReport({ categoria_id: 1 });

      expect(api.get).toHaveBeenCalledWith('/reportes/inventario', {
        params: { categoria_id: 1 },
      });
      expect(result.items).toHaveLength(2);
      expect(result.resumen.totalProductos).toBe(2);
    });
  });

  describe('fetchMovementsReport', () => {
    it('obtiene reporte de movimientos', async () => {
      const mockData = {
        data: {
          data: [
            { fecha: '2025-11-01', tipo: 'entrada', cantidad: 100 },
            { fecha: '2025-11-02', tipo: 'salida', cantidad: 50 },
          ],
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await reportesService.fetchMovementsReport({ agrupacion: 'dia' });

      expect(api.get).toHaveBeenCalledWith('/reportes/movimientos', {
        params: { agrupacion: 'dia' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('fetchAlertsReport', () => {
    it('obtiene reporte de alertas', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, producto_nombre: 'Producto A', stock_actual: 2, stock_minimo: 10 },
            ],
            resumen: {
              totalAlertas: 1,
            },
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await reportesService.fetchAlertsReport();

      expect(api.get).toHaveBeenCalledWith('/reportes/alertas', { params: undefined });
      expect(result.items).toHaveLength(1);
      expect(result.resumen.totalAlertas).toBe(1);
    });
  });

  describe('fetchValuationReport', () => {
    it('obtiene reporte de valorización', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { categoria: 'Electrónica', valorTotal: 50000 },
              { categoria: 'Alimentos', valorTotal: 30000 },
            ],
            resumen: {
              valorTotal: 80000,
            },
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await reportesService.fetchValuationReport();

      expect(api.get).toHaveBeenCalledWith('/reportes/valorizacion', { params: undefined });
      expect(result.items).toHaveLength(2);
      expect(result.resumen.valorTotal).toBe(80000);
    });
  });

  describe('fetchAnalyticsReport', () => {
    it('obtiene reporte de analytics con metadata', async () => {
      const mockData = {
        data: {
          data: {
            abc: [
              { codigo: 'P-1', categoria: 'A', porcentaje: 70 },
              { codigo: 'P-2', categoria: 'B', porcentaje: 20 },
            ],
            sinMovimientos: 5,
          },
          meta: {
            generado: '2025-11-10',
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await reportesService.fetchAnalyticsReport();

      expect(api.get).toHaveBeenCalledWith('/reportes/analytics', { params: undefined });
      expect(result.abc).toHaveLength(2);
      expect(result.sinMovimientos).toBe(5);
      expect(result.meta.generado).toBe('2025-11-10');
    });

    it('maneja respuesta sin metadata', async () => {
      const mockData = {
        data: {
          data: {
            abc: [],
            sinMovimientos: 0,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await reportesService.fetchAnalyticsReport();

      expect(result.meta).toEqual({});
    });
  });

  describe('exportReportExcel', () => {
    it('exporta reporte a Excel con nombre de archivo del header', async () => {
      const mockBlob = new Blob(['excel data'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const mockResponse = {
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="reporte_inventario_2025-11-10.xlsx"',
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await reportesService.exportReportExcel('inventario', { categoria_id: 1 });

      expect(api.get).toHaveBeenCalledWith('/reportes/export/inventario', {
        params: { categoria_id: 1 },
        responseType: 'blob',
      });
      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('reporte_inventario_2025-11-10.xlsx');
    });

    it('genera nombre de archivo por defecto si no hay header', async () => {
      const mockBlob = new Blob(['excel data']);

      const mockResponse = {
        data: mockBlob,
        headers: {},
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await reportesService.exportReportExcel('movimientos');

      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toMatch(/^reporte_movimientos_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });
});
