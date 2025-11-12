import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';

export default function useApiMutation({
  mutationFn,
  method = 'post',
  url,
  invalidate = [],
  onSuccess,
  onError,
  axiosConfig,
  queryClient: externalQueryClient,
} = {}) {
  if (!mutationFn && !url) {
    throw new Error('useApiMutation requires either mutationFn or url');
  }

  const queryClient = externalQueryClient || useQueryClient();

  const finalMutationFn = mutationFn || (async (payload) => {
    const response = await api.request({ method, url, data: payload, ...axiosConfig });
    return response.data?.data ?? response.data;
  });

  return useMutation({
    mutationFn: finalMutationFn,
    onSuccess: async (data, variables, context) => {
      await Promise.all(
        invalidate.map((key) => queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] }))
      );
      if (onSuccess) await onSuccess(data, variables, context, queryClient);
    },
    onError,
  });
}
