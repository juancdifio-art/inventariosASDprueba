import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';

const queryKey = 'productos';

export function useProductosList(params) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [queryKey, params],
    queryFn: async () => {
      const { data } = await api.get('/productos', { params });
      return data.data;
    },
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  return { ...query, invalidate };
}
