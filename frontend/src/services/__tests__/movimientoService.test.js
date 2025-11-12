import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as movimientoService from '../movimientoService';
import api from '../../api/api';

vi.mock('../../api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock DOM APIs
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
globalThis.URL.revokeObjectURL = vi.fn();

describe('movimientoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('fetchMovimientos', () => {
    it('obtiene lista de movimientos', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, tipo: 'entrada', cantidad: 10, producto_nombre: 'Producto 1' },
              { id: 2, tipo: 'salida', cantidad: 5, producto_nombre: 'Producto 2' },
            ],
            total: 2,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const params = { page: 1, limit: 10 };
      const result = await movimientoService.fetchMovimientos(params);

      expect(api.get).toHaveBeenCalledWith('/movimientos', { params });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].tipo).toBe('entrada');
    });

    it('filtra movimientos por tipo', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, tipo: 'entrada', cantidad: 10 },
            ],
            total: 1,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await movimientoService.fetchMovimientos({ tipo: 'entrada' });

      expect(api.get).toHaveBeenCalledWith('/movimientos', { params: { tipo: 'entrada' } });
      expect(result.items[0].tipo).toBe('entrada');
    });
  });

  describe('fetchMovimientosSummary', () => {
    it('obtiene resumen de movimientos', async () => {
      const mockSummary = {
        data: {
          data: {
            items: [
              { tipo: 'entrada', movimientos: 10, cantidad_total: 100 },
              { tipo: 'salida', movimientos: 5, cantidad_total: 50 },
            ],
            resumen: {
              totalMovimientos: 15,
              totalCantidad: 150,
            },
          },
        },
      };

      api.get.mockResolvedValue(mockSummary);

      const result = await movimientoService.fetchMovimientosSummary();

      expect(api.get).toHaveBeenCalledWith('/movimientos/summary', { params: undefined });
      expect(result.items).toHaveLength(2);
      expect(result.resumen.totalMovimientos).toBe(15);
    });
  });

  describe('exportMovimientosCSV', () => {
    it('descarga archivo CSV', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      api.get.mockResolvedValue({ data: mockBlob });

      const mockLink = document.createElement('a');
      const clickSpy = vi.spyOn(mockLink, 'click');
      const removeSpy = vi.spyOn(mockLink, 'remove');
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

      await movimientoService.exportMovimientosCSV({ tipo: 'entrada' });

      expect(api.get).toHaveBeenCalledWith('/movimientos/export/csv', {
        params: { tipo: 'entrada' },
        responseType: 'blob',
      });
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('exportMovimientosExcel', () => {
    it('descarga archivo Excel', async () => {
      const mockBlob = new Blob(['excel,data'], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      api.get.mockResolvedValue({ data: mockBlob });

      const mockLink = document.createElement('a');
      const clickSpy = vi.spyOn(mockLink, 'click');
      const removeSpy = vi.spyOn(mockLink, 'remove');
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

      await movimientoService.exportMovimientosExcel();

      expect(api.get).toHaveBeenCalledWith('/movimientos/export/excel', {
        params: undefined,
        responseType: 'blob',
      });
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });
  });
});
