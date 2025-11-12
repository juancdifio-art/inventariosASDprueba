import api from '../api/api';

export function listProductos(params) {
  return api.get('/productos', { params }).then((res) => res.data.data);
}

export function getProducto(id) {
  return api.get(`/productos/${id}`).then((res) => res.data.data);
}

export function updateProducto(id, payload) {
  return api.put(`/productos/${id}`, payload).then((res) => res.data.data);
}

export function deleteProducto(id) {
  return api.delete(`/productos/${id}`).then((res) => res.data);
}

export function createProducto(payload) {
  return api.post('/productos', payload).then((res) => res.data.data);
}
