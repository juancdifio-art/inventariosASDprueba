import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAlertConfigs,
  upsertAlertConfig,
  toggleAlertConfig,
  deleteAlertConfig,
  runAlertConfigJob,
} from '../services/alertaService.js';

const QUERY_KEY = ['alertas', 'configuracion'];

export function useAlertConfigs() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAlertConfigs,
    staleTime: 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const upsert = useMutation({
    mutationFn: upsertAlertConfig,
    onSuccess: invalidate,
  });

  const toggle = useMutation({
    mutationFn: toggleAlertConfig,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteAlertConfig,
    onSuccess: invalidate,
  });

  const run = useMutation({
    mutationFn: runAlertConfigJob,
  });

  return useMemo(() => ({
    ...listQuery,
    upsert,
    toggle,
    remove,
    run,
  }), [listQuery, upsert, toggle, remove, run]);
}
