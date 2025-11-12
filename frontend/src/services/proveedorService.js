import api from '../api/api';

export function listProveedores(params = {}) {
  const { search, ...rest } = params ?? {};
  const endpoint = search ? '/proveedores/search' : '/proveedores';
  const query = search ? { search, ...rest } : rest;
  return api.get(endpoint, { params: query }).then((res) => res.data.data);
}

export function getProveedor(id) {
  return api.get(`/proveedores/${id}`).then((res) => res.data.data);
}

export function createProveedor(payload) {
  return api.post('/proveedores', payload).then((res) => res.data.data);
}

export function updateProveedor(id, payload) {
  return api.put(`/proveedores/${id}`, payload).then((res) => res.data.data);
}

export function deleteProveedor(id) {
  return api.delete(`/proveedores/${id}`).then((res) => res.data);
}

export function listProductosByProveedor(proveedorId, params = {}) {
  if (!proveedorId) throw new Error('proveedorId es requerido');
  const query = { proveedor_id: proveedorId, ...params };
  return api.get('/productos', { params: query }).then((res) => res.data.data);
}
