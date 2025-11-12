import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  listCategorias,
  getCategoria,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategoriasTree,
} from '../services/categoriaService.js';

const LIST_KEY = 'categorias';
const TREE_KEY = 'categorias-tree';

export function useCategoriasList(params) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [LIST_KEY, params],
    queryFn: () => listCategorias(params),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
  const invalidateTree = () => queryClient.invalidateQueries({ queryKey: [TREE_KEY] });

  return { ...query, invalidate, invalidateTree };
}

export function useCategoria(id, options = {}) {
  return useQuery({
    queryKey: ['categoria', id],
    queryFn: () => getCategoria(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCategoriasTree(options = {}) {
  return useQuery({
    queryKey: [TREE_KEY],
    queryFn: getCategoriasTree,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [TREE_KEY] });
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateCategoria(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [TREE_KEY] });
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [TREE_KEY] });
    },
  });
}
