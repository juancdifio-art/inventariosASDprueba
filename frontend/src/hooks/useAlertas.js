import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';

const ALERTAS_KEY = 'alertas';

export function useAlertasList(params) {
  return useQuery({
    queryKey: [ALERTAS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get('/alertas', { params });
      return data.data;
    },
    keepPreviousData: true,
  });
}

export function useAlertasStats(params) {
  return useQuery({
    queryKey: [ALERTAS_KEY, 'stats', params],
    queryFn: async () => {
      const { data } = await api.get('/alertas/stats', { params });
      return data.data;
    },
  });
}

export function useCreateAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/alertas', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERTAS_KEY] });
    },
  });
}

export function useUpdateAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/alertas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERTAS_KEY] });
    },
  });
}

export function useDeleteAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/alertas/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERTAS_KEY] });
    },
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/alertas/${id}/read`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERTAS_KEY] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/alertas/${id}/resolve`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERTAS_KEY] });
    },
  });
}

export function useAlertasRefresh(queryKey = ALERTAS_KEY) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  }, [queryClient, queryKey]);
}
