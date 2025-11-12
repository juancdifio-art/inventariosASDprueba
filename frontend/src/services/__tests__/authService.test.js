import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../authService';
import api from '../../api/api';

vi.mock('../../api/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('realiza login exitoso', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'fake-jwt-token',
            user: {
              id: 1,
              nombre: 'Test User',
              email: 'test@example.com',
              rol: 'admin',
            },
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.token).toBe('fake-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('maneja error de credenciales inválidas', async () => {
      api.post.mockRejectedValue(new Error('Credenciales inválidas'));

      await expect(
        authService.login('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('maneja error de red', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Network error');
    });
  });

  describe('getCurrentUser', () => {
    it('obtiene el usuario actual', async () => {
      const mockUser = {
        data: {
          data: {
            id: 1,
            nombre: 'Current User',
            email: 'current@example.com',
            rol: 'gerente',
          },
        },
      };

      api.get.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.nombre).toBe('Current User');
      expect(result.rol).toBe('gerente');
    });

    it('maneja error cuando no hay sesión', async () => {
      api.get.mockRejectedValue(new Error('No autorizado'));

      await expect(authService.getCurrentUser()).rejects.toThrow('No autorizado');
    });
  });

  describe('logout', () => {
    it('llama a removeItem del localStorage', () => {
      const removeItemSpy = vi.spyOn(localStorage, 'removeItem');

      authService.logout();

      expect(removeItemSpy).toHaveBeenCalledWith('token');
    });

    it('no falla si no hay token', () => {
      expect(() => authService.logout()).not.toThrow();
    });
  });
});
