import api from '../api/api';

export async function fetchInventoryReport(params) {
  const { data } = await api.get('/reportes/inventario', { params });
  return data?.data ?? data;
}

export async function fetchMovementsReport(params) {
  const { data } = await api.get('/reportes/movimientos', { params });
  return data?.data ?? data;
}

export async function fetchAlertsReport(params) {
  const { data } = await api.get('/reportes/alertas', { params });
  return data?.data ?? data;
}

export async function fetchValuationReport(params) {
  const { data } = await api.get('/reportes/valorizacion', { params });
  return data?.data ?? data;
}

export async function fetchAnalyticsReport(params) {
  const { data } = await api.get('/reportes/analytics', { params });
  const payload = data?.data ?? {};
  return {
    ...payload,
    meta: data?.meta ?? {},
  };
}

export async function exportReportExcel(tipo, params) {
  const response = await api.get(`/reportes/export/${tipo}`, {
    params,
    responseType: 'blob',
  });

  const disposition = response.headers?.['content-disposition'] ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;

  return {
    blob: response.data,
    filename,
  };
}
