import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

function normalizeKey(queryKey) {
  if (Array.isArray(queryKey)) return queryKey;
  return [queryKey];
}

export default function useApiQuery(queryKey, {
  queryFn,
  url,
  params,
  axiosConfig,
  enabled = true,
  select,
  ...options
} = {}) {
  if (!queryFn && !url) {
    throw new Error('useApiQuery requires either queryFn or url');
  }

  const finalQueryFn = queryFn || (async () => {
    const response = await api.get(url, { params, ...axiosConfig });
    return response.data?.data ?? response.data;
  });

  return useQuery({
    queryKey: normalizeKey(queryKey),
    queryFn: finalQueryFn,
    enabled,
    select,
    ...options,
  });
}
