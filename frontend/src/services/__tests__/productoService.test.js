import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as productoService from '../productoService';
import api from '../../api/api';

// Mock del módulo api
vi.mock('../../api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('productoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listProductos', () => {
    it('obtiene lista de productos con parámetros', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, nombre: 'Producto 1', precio: 100 },
              { id: 2, nombre: 'Producto 2', precio: 200 },
            ],
            total: 2,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const params = { page: 1, limit: 10 };
      const result = await productoService.listProductos(params);

      expect(api.get).toHaveBeenCalledWith('/productos', { params });
      expect(result).toEqual(mockData.data.data);
      expect(result.items).toHaveLength(2);
    });

    it('maneja errores al listar productos', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(productoService.listProductos()).rejects.toThrow('Network error');
    });
  });

  describe('getProducto', () => {
    it('obtiene un producto por ID', async () => {
      const mockProducto = {
        data: {
          data: {
            id: 1,
            codigo: 'PROD-001',
            nombre: 'Producto Test',
            precio: 150,
          },
        },
      };

      api.get.mockResolvedValue(mockProducto);

      const result = await productoService.getProducto(1);

      expect(api.get).toHaveBeenCalledWith('/productos/1');
      expect(result).toEqual(mockProducto.data.data);
      expect(result.codigo).toBe('PROD-001');
    });

    it('maneja errores al obtener producto', async () => {
      api.get.mockRejectedValue(new Error('Producto no encontrado'));

      await expect(productoService.getProducto(999)).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('createProducto', () => {
    it('crea un nuevo producto', async () => {
      const newProducto = {
        codigo: 'PROD-NEW',
        nombre: 'Nuevo Producto',
        precio: 100,
        stock_actual: 50,
      };

      const mockResponse = {
        data: {
          data: {
            id: 3,
            ...newProducto,
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await productoService.createProducto(newProducto);

      expect(api.post).toHaveBeenCalledWith('/productos', newProducto);
      expect(result).toEqual(mockResponse.data.data);
      expect(result.id).toBe(3);
    });

    it('maneja errores de validación al crear', async () => {
      api.post.mockRejectedValue(new Error('Código duplicado'));

      await expect(
        productoService.createProducto({ codigo: 'DUP' })
      ).rejects.toThrow('Código duplicado');
    });
  });

  describe('updateProducto', () => {
    it('actualiza un producto existente', async () => {
      const updates = {
        nombre: 'Producto Actualizado',
        precio: 250,
      };

      const mockResponse = {
        data: {
          data: {
            id: 1,
            codigo: 'PROD-001',
            ...updates,
          },
        },
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await productoService.updateProducto(1, updates);

      expect(api.put).toHaveBeenCalledWith('/productos/1', updates);
      expect(result).toEqual(mockResponse.data.data);
      expect(result.nombre).toBe('Producto Actualizado');
    });

    it('maneja errores al actualizar', async () => {
      api.put.mockRejectedValue(new Error('Producto no encontrado'));

      await expect(
        productoService.updateProducto(999, { nombre: 'Test' })
      ).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('deleteProducto', () => {
    it('elimina un producto', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Producto eliminado',
        },
      };

      api.delete.mockResolvedValue(mockResponse);

      const result = await productoService.deleteProducto(1);

      expect(api.delete).toHaveBeenCalledWith('/productos/1');
      expect(result).toEqual(mockResponse.data);
      expect(result.success).toBe(true);
    });

    it('maneja errores al eliminar', async () => {
      api.delete.mockRejectedValue(new Error('No se puede eliminar'));

      await expect(productoService.deleteProducto(1)).rejects.toThrow('No se puede eliminar');
    });
  });
});
