import api from '../api/api';

export async function fetchAlertas(params) {
  const { data } = await api.get('/alertas', { params });
  return data.data;
}

export async function fetchAlertasStats(params) {
  const { data } = await api.get('/alertas/stats', { params });
  return data.data;
}

export async function createAlerta(payload) {
  const { data } = await api.post('/alertas', payload);
  return data.data;
}

export async function updateAlerta(id, payload) {
  const { data } = await api.patch(`/alertas/${id}`, payload);
  return data.data;
}

export async function deleteAlerta(id) {
  await api.delete(`/alertas/${id}`);
  return id;
}

export async function markAlertaAsRead(id) {
  const { data } = await api.post(`/alertas/${id}/read`);
  return data.data;
}

export async function resolveAlerta(id) {
  const { data } = await api.post(`/alertas/${id}/resolve`);
  return data.data;
}

export async function runStockAlertsManually() {
  const { data } = await api.post('/alertas/run');
  return data;
}
