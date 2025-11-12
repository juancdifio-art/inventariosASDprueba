import api from '../api/api';

const serializeParams = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  return new URLSearchParams(entries).toString();
};

export const getAllCampos = (params = {}) => {
  const query = serializeParams({
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    aplica_a: params.aplica_a,
    tipo: params.tipo,
    grupo: params.grupo,
    industria: params.industria,
    activo: params.activo,
    search: params.search,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });
  return api.get(`/configuracion-campos${query ? `?${query}` : ''}`).then((res) => res.data.data);
};

export const getCampoById = (id) => api.get(`/configuracion-campos/${id}`).then((res) => res.data.data);

export const getCamposPorAplicacion = (aplica_a = 'productos', params = {}) => {
  const query = serializeParams({
    industria: params.industria,
    agrupados: params.agrupados,
    solo_visibles_en_listado: params.solo_visibles_en_listado,
    solo_visibles_en_detalle: params.solo_visibles_en_detalle,
  });
  return api
    .get(`/configuracion-campos/aplicacion/${aplica_a}${query ? `?${query}` : ''}`)
    .then((res) => res.data.data);
};

export const createCampo = (payload) => api.post('/configuracion-campos', payload).then((res) => res.data.data);

export const updateCampo = (id, payload) => api.put(`/configuracion-campos/${id}`, payload).then((res) => res.data.data);

export const deleteCampo = (id) => api.delete(`/configuracion-campos/${id}`).then((res) => res.data.data ?? res.data);

export const validarValorCampo = (id, valor) =>
  api.post(`/configuracion-campos/${id}/validar`, { valor }).then((res) => res.data.data ?? res.data);

export const getAllTemplates = (params = {}) => {
  const query = serializeParams({ activo: params.activo, industria: params.industria });
  return api.get(`/configuracion-campos/templates/all${query ? `?${query}` : ''}`).then((res) => res.data.data);
};

export const getTemplateById = (id) =>
  api.get(`/configuracion-campos/templates/${id}`).then((res) => res.data.data);

export const getTemplateByCodigo = (codigo) =>
  api.get(`/configuracion-campos/templates/codigo/${codigo}`).then((res) => res.data.data);

export const createTemplate = (payload) =>
  api.post('/configuracion-campos/templates', payload).then((res) => res.data.data);

export const updateTemplate = (id, payload) =>
  api.put(`/configuracion-campos/templates/${id}`, payload).then((res) => res.data.data);

export const deleteTemplate = (id) =>
  api.delete(`/configuracion-campos/templates/${id}`).then((res) => res.data.data ?? res.data);

export const aplicarTemplate = (codigo) =>
  api.post(`/configuracion-campos/templates/${codigo}/aplicar`).then((res) => res.data.data);

export const TIPOS_CAMPO = [
  { value: 'texto', label: 'Texto (Short)' },
  { value: 'texto_largo', label: 'Texto Largo' },
  { value: 'numero', label: 'Número Entero' },
  { value: 'decimal', label: 'Número Decimal' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'select', label: 'Lista (Single)' },
  { value: 'multi_select', label: 'Lista (Multiple)' },
  { value: 'email', label: 'Email' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'url', label: 'URL' },
  { value: 'color', label: 'Color' },
];

export const APLICACIONES = [
  { value: 'productos', label: 'Productos' },
  { value: 'categorias', label: 'Categorías' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'movimientos', label: 'Movimientos' },
  { value: 'alertas', label: 'Alertas' },
];
