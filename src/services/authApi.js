import { API_BASE } from './apiBase';

export const getAuthToken = () => localStorage.getItem('fi_token') || localStorage.getItem('token') || '';

export const authHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...authHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data?.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function login({ email, access_code }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, access_code }),
  });
}

export async function verifyToken(token) {
  return apiFetch('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function changePassword({ current_password, new_password }) {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function forgotPassword(email) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ email, token, new_password }) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, new_password }),
  });
}
