import api from '../api/api';

export async function fetchAuditorias(params) {
  const { data } = await api.get('/auditorias', { params });
  return data.data;
}

export async function fetchAuditoriaStats(params) {
  const { data } = await api.get('/auditorias/stats', { params });
  return data.data;
}

export async function fetchAuditoriaById(id) {
  const { data } = await api.get(`/auditorias/${id}`);
  return data.data;
}

export async function fetchHistorialByRegistro(tabla, registroId, params) {
  const { data } = await api.get(`/auditorias/${tabla}/${registroId}/historial`, { params });
  return data.data;
}
