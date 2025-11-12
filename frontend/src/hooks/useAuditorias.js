import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditorias, fetchAuditoriaStats, fetchHistorialByRegistro } from '../services/auditoriaService';

const QUERY_KEYS = {
  list: 'auditorias-list',
  stats: 'auditorias-stats',
  historial: 'auditorias-historial',
};

export function useAuditoriasList(params) {
  const queryParams = useMemo(() => params, [params]);
  const query = useQuery({
    queryKey: [QUERY_KEYS.list, queryParams],
    queryFn: () => fetchAuditorias(queryParams),
    keepPreviousData: true,
  });

  return query;
}

export function useAuditoriasStats(params) {
  const queryParams = useMemo(() => params, [params]);
  return useQuery({
    queryKey: [QUERY_KEYS.stats, queryParams],
    queryFn: () => fetchAuditoriaStats(queryParams),
    staleTime: 60 * 1000,
  });
}

export function useAuditoriaHistorial(tabla, registroId, params) {
  const queryParams = useMemo(() => params, [tabla, registroId, params]);
  return useQuery({
    queryKey: [QUERY_KEYS.historial, tabla, registroId, queryParams],
    queryFn: () => fetchHistorialByRegistro(tabla, registroId, queryParams),
    enabled: Boolean(tabla && registroId),
  });
}
