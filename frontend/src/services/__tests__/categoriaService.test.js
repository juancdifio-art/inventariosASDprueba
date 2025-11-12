import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as categoriaService from '../categoriaService';
import api from '../../api/api';

vi.mock('../../api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('categoriaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCategorias', () => {
    it('obtiene lista de categorías', async () => {
      const mockData = {
        data: {
          data: {
            items: [
              { id: 1, nombre: 'Electrónica', activo: true },
              { id: 2, nombre: 'Alimentos', activo: true },
            ],
            total: 2,
          },
        },
      };

      api.get.mockResolvedValue(mockData);

      const result = await categoriaService.listCategorias({ page: 1 });

      expect(api.get).toHaveBeenCalledWith('/categorias', { params: { page: 1 } });
      expect(result.items).toHaveLength(2);
    });
  });

  describe('getCategoria', () => {
    it('obtiene una categoría por ID', async () => {
      const mockCategoria = {
        data: {
          data: {
            id: 1,
            nombre: 'Electrónica',
            descripcion: 'Productos electrónicos',
            activo: true,
          },
        },
      };

      api.get.mockResolvedValue(mockCategoria);

      const result = await categoriaService.getCategoria(1);

      expect(api.get).toHaveBeenCalledWith('/categorias/1');
      expect(result.nombre).toBe('Electrónica');
    });
  });

  describe('createCategoria', () => {
    it('crea una nueva categoría', async () => {
      const newCategoria = {
        nombre: 'Nueva Categoría',
        descripcion: 'Descripción',
        activo: true,
      };

      const mockResponse = {
        data: {
          data: {
            id: 3,
            ...newCategoria,
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await categoriaService.createCategoria(newCategoria);

      expect(api.post).toHaveBeenCalledWith('/categorias', newCategoria);
      expect(result.id).toBe(3);
    });
  });

  describe('updateCategoria', () => {
    it('actualiza una categoría existente', async () => {
      const updates = {
        nombre: 'Categoría Actualizada',
        descripcion: 'Nueva descripción',
      };

      const mockResponse = {
        data: {
          data: {
            id: 1,
            ...updates,
            activo: true,
          },
        },
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await categoriaService.updateCategoria(1, updates);

      expect(api.put).toHaveBeenCalledWith('/categorias/1', updates);
      expect(result.nombre).toBe('Categoría Actualizada');
    });
  });

  describe('deleteCategoria', () => {
    it('elimina una categoría', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Categoría eliminada',
        },
      };

      api.delete.mockResolvedValue(mockResponse);

      const result = await categoriaService.deleteCategoria(1);

      expect(api.delete).toHaveBeenCalledWith('/categorias/1');
      expect(result.success).toBe(true);
    });
  });

  describe('getCategoriasTree', () => {
    it('obtiene el árbol de categorías', async () => {
      const mockTree = {
        data: {
          data: [
            {
              id: 1,
              nombre: 'Electrónica',
              children: [
                { id: 2, nombre: 'Computadoras', children: [] },
                { id: 3, nombre: 'Celulares', children: [] },
              ],
            },
          ],
        },
      };

      api.get.mockResolvedValue(mockTree);

      const result = await categoriaService.getCategoriasTree();

      expect(api.get).toHaveBeenCalledWith('/categorias/arbol');
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(2);
    });
  });
});
