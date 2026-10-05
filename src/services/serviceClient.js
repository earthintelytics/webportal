/**
 * Shared fetch for tenant services built against a contract in
 * docs/WORK_SPLIT.md. A missing endpoint (404/405/non-JSON) or no network
 * rejects with NotConnectedError, so screens can say "not connected yet"
 * honestly; other failures reject with the backend's message.
 */
import { NotConnectedError } from './datasetsApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

export async function serviceCall(path, { method = 'GET', body, form, auth = true } = {}) {
  const headers = {};
  const token = auth ? localStorage.getItem('fi_token') : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new NotConnectedError();
  }
  if (res.status === 404 || res.status === 405) throw new NotConnectedError();
  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  if (!type.includes('json')) throw new NotConnectedError();
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.detail || data.message || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const query = (params) => {
  const q = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v != null && v !== '' && v !== 'all')).toString();
  return q ? `?${q}` : '';
};

export { NotConnectedError };
