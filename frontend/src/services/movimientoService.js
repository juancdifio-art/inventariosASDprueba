import api from '../api/api';

export async function fetchMovimientos(params) {
  const { data } = await api.get('/movimientos', { params });
  return data.data;
}

export async function fetchMovimientosSummary(params) {
  const { data } = await api.get('/movimientos/summary', { params });
  return data.data;
}

export async function exportMovimientosCSV(params) {
  const response = await api.get('/movimientos/export/csv', {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `movimientos_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportMovimientosExcel(params) {
  const response = await api.get('/movimientos/export/excel', {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `movimientos_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
