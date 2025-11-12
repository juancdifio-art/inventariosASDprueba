import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

// Create a custom render function that includes all providers
export function renderWithProviders(ui, options = {}) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    initialAuthState = null,
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider initialState={initialAuthState}>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock user data
export const mockUser = {
  id: 1,
  nombre: 'Test User',
  email: 'test@example.com',
  rol: 'admin',
};

export const mockGerenteUser = {
  id: 2,
  nombre: 'Gerente Test',
  email: 'gerente@example.com',
  rol: 'gerente',
};

export const mockUsuarioUser = {
  id: 3,
  nombre: 'Usuario Test',
  email: 'usuario@example.com',
  rol: 'usuario',
};

// Mock producto data
export const mockProducto = {
  id: 1,
  codigo: 'TEST-001',
  nombre: 'Producto Test',
  descripcion: 'Descripción de prueba',
  precio: 100,
  stock_actual: 50,
  stock_minimo: 10,
  activo: true,
  categoria_id: 1,
  proveedor_id: 1,
};

// Mock categoria data
export const mockCategoria = {
  id: 1,
  nombre: 'Categoría Test',
  descripcion: 'Descripción de categoría',
  activo: true,
};

// Mock proveedor data
export const mockProveedor = {
  id: 1,
  nombre: 'Proveedor Test',
  email: 'proveedor@test.com',
  telefono: '123-456-7890',
  activo: true,
};

// Wait for async updates
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
