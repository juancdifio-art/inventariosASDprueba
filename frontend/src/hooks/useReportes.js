import { useQuery } from '@tanstack/react-query';
import {
  fetchInventoryReport,
  fetchMovementsReport,
  fetchAlertsReport,
  fetchValuationReport,
  fetchAnalyticsReport,
} from '../services/reportesService.js';

export const useInventoryReport = (filters, options = {}) => useQuery({
  queryKey: ['reportes', 'inventario', filters],
  queryFn: () => fetchInventoryReport(filters),
  keepPreviousData: true,
  ...options,
});

export const useMovementsReport = (filters, options = {}) => useQuery({
  queryKey: ['reportes', 'movimientos', filters],
  queryFn: () => fetchMovementsReport(filters),
  keepPreviousData: true,
  ...options,
});

export const useAlertsReport = (filters, options = {}) => useQuery({
  queryKey: ['reportes', 'alertas', filters],
  queryFn: () => fetchAlertsReport(filters),
  keepPreviousData: true,
  ...options,
});

export const useValuationReport = (filters, options = {}) => useQuery({
  queryKey: ['reportes', 'valorizacion', filters],
  queryFn: () => fetchValuationReport(filters),
  keepPreviousData: true,
  ...options,
});

export const useAnalyticsReport = (filters, options = {}) => useQuery({
  queryKey: ['reportes', 'analytics', filters],
  queryFn: () => fetchAnalyticsReport(filters),
  keepPreviousData: true,
  ...options,
});
