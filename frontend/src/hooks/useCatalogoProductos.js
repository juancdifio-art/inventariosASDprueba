import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

export function useCatalogoProductos(params = {}) {
  const query = useQuery({
    queryKey: ['catalogo-productos', params],
    queryFn: async () => {
      const { data } = await api.get('/productos', {
        params: {
          page: 1,
          limit: params.limit ?? 200,
          search: params.search ?? '',
          ...params,
        },
      });
      return data.data?.items ?? [];
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  return {
    productos: query.data ?? [],
    isLoadingProductos: query.isLoading,
    refetchProductos: query.refetch,
  };
}
