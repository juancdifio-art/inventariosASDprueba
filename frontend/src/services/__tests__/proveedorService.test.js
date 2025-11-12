import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as proveedorService from '../proveedorService';
import api from '../../api/api';

vi.mock('../../api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('proveedorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listProveedores', () => {
    it('obtiene lista de proveedores', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, nombre: 'Proveedor A', email: 'a@test.com' },
              { id: 2, nombre: 'Proveedor B', email: 'b@test.com' },
            ],
            total: 2,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await proveedorService.listProveedores({ page: 1 });

      expect(api.get).toHaveBeenCalledWith('/proveedores', { params: { page: 1 } });
      expect(result.items).toHaveLength(2);
    });

    it('usa endpoint de búsqueda cuando hay search', async () => {
      const mockData = {
        data: {
          data: {
            items: [{ id: 1, nombre: 'Coca-Cola' }],
            total: 1,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      await proveedorService.listProveedores({ search: 'Coca' });

      expect(api.get).toHaveBeenCalledWith('/proveedores/search', {
        params: { search: 'Coca' },
      });
    });
  });

  describe('getProveedor', () => {
    it('obtiene un proveedor por ID', async () => {
      const mockProveedor = {
        data: {
          data: {
            id: 1,
            nombre: 'Proveedor Test',
            email: 'test@proveedor.com',
            telefono: '123-456-7890',
          },
        },
      };

      api.get.mockResolvedValue(mockProveedor);

      const result = await proveedorService.getProveedor(1);

      expect(api.get).toHaveBeenCalledWith('/proveedores/1');
      expect(result.nombre).toBe('Proveedor Test');
    });
  });

  describe('createProveedor', () => {
    it('crea un nuevo proveedor', async () => {
      const newProveedor = {
        nombre: 'Nuevo Proveedor',
        email: 'nuevo@proveedor.com',
        telefono: '555-1234',
      };

      const mockResponse = {
        data: {
          data: {
            id: 3,
            ...newProveedor,
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await proveedorService.createProveedor(newProveedor);

      expect(api.post).toHaveBeenCalledWith('/proveedores', newProveedor);
      expect(result.id).toBe(3);
    });
  });

  describe('updateProveedor', () => {
    it('actualiza un proveedor existente', async () => {
      const updates = {
        nombre: 'Proveedor Actualizado',
        telefono: '999-8888',
      };

      const mockResponse = {
        data: {
          data: {
            id: 1,
            ...updates,
            email: 'original@test.com',
          },
        },
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await proveedorService.updateProveedor(1, updates);

      expect(api.put).toHaveBeenCalledWith('/proveedores/1', updates);
      expect(result.nombre).toBe('Proveedor Actualizado');
    });
  });

  describe('deleteProveedor', () => {
    it('elimina un proveedor', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Proveedor eliminado',
        },
      };

      api.delete.mockResolvedValue(mockResponse);

      const result = await proveedorService.deleteProveedor(1);

      expect(api.delete).toHaveBeenCalledWith('/proveedores/1');
      expect(result.success).toBe(true);
    });
  });

  describe('listProductosByProveedor', () => {
    it('obtiene productos de un proveedor', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, nombre: 'Producto 1', proveedor_id: 5 },
              { id: 2, nombre: 'Producto 2', proveedor_id: 5 },
            ],
            total: 2,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await proveedorService.listProductosByProveedor(5);

      expect(api.get).toHaveBeenCalledWith('/productos', {
        params: { proveedor_id: 5 },
      });
      expect(result.items).toHaveLength(2);
    });

    it('lanza error si no se proporciona proveedorId', () => {
      expect(() => proveedorService.listProductosByProveedor()).toThrow(
        'proveedorId es requerido'
      );
    });
  });
});
