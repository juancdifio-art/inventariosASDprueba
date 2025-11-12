import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProveedores,
  getProveedor,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  listProductosByProveedor,
} from '../services/proveedorService.js';

const LIST_KEY = 'proveedores';
const ITEM_KEY = 'proveedor';
const PRODUCTOS_KEY = 'proveedor-productos';

export function useProveedoresList(params) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [LIST_KEY, params],
    queryFn: () => listProveedores(params),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [LIST_KEY] });

  return { ...query, invalidate };
}

export function useProveedor(id, options = {}) {
  return useQuery({
    queryKey: [ITEM_KEY, id],
    queryFn: () => getProveedor(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProveedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
    },
  });
}

export function useUpdateProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateProveedor(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: [ITEM_KEY, variables.id] });
        queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY, variables.id] });
      }
    },
  });
}

export function useDeleteProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProveedor,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      if (id) {
        queryClient.removeQueries({ queryKey: [ITEM_KEY, id] });
        queryClient.removeQueries({ queryKey: [PRODUCTOS_KEY, id] });
      }
    },
  });
}

export function useProductosDeProveedor(proveedorId, params = {}, options = {}) {
  return useQuery({
    queryKey: [PRODUCTOS_KEY, proveedorId, params],
    queryFn: () => listProductosByProveedor(proveedorId, params),
    enabled: Boolean(proveedorId),
    keepPreviousData: true,
    ...options,
  });
}
