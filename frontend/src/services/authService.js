import api from '../api/api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export function logout() {
  localStorage.removeItem('token');
}
