import api from '../api/api';

export function listCategorias(params) {
  return api.get('/categorias', { params }).then((res) => res.data.data);
}

export function getCategoria(id) {
  return api.get(`/categorias/${id}`).then((res) => res.data.data);
}

export function createCategoria(payload) {
  return api.post('/categorias', payload).then((res) => res.data.data);
}

export function updateCategoria(id, payload) {
  return api.put(`/categorias/${id}`, payload).then((res) => res.data.data);
}

export function deleteCategoria(id) {
  return api.delete(`/categorias/${id}`).then((res) => res.data);
}

export function getCategoriasTree() {
  return api.get('/categorias/arbol').then((res) => res.data.data);
}
