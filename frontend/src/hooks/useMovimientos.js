import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchMovimientos,
  fetchMovimientosSummary,
  exportMovimientosCSV,
  exportMovimientosExcel,
} from '../services/movimientoService.js';

export function useMovimientos(params, { onError } = {}) {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await fetchMovimientos(params);
      setData(result);
      setError('');
    } catch (err) {
      const message = err?.response?.data?.message || 'Error al cargar movimientos';
      setError(message);
      onError?.(message);
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [params, onError]);

  const fetchSummary = useCallback(async () => {
    try {
      const result = await fetchMovimientosSummary(params);
      setSummary(result);
    } catch (err) {
      const message = err?.response?.data?.message || 'Error al cargar resumen de movimientos';
      onError?.(message);
    }
  }, [params, onError]);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, [fetchData, fetchSummary]);

  const exportarCSV = useCallback(async () => {
    await exportMovimientosCSV(params);
  }, [params]);

  const exportarExcel = useCallback(async () => {
    await exportMovimientosExcel(params);
  }, [params]);

  return useMemo(() => ({
    data,
    summary,
    isLoading,
    isFetching,
    error,
    exportarCSV,
    exportarExcel,
  }), [data, summary, isLoading, isFetching, error, exportarCSV, exportarExcel]);
}
