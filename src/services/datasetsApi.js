/**
 * Client data (open questions and calibration) — contract in docs/WORK_SPLIT.md,
 * "Client data". Endpoints are built by the backend team; until they exist
 * every call rejects with NotConnectedError and the UI says so honestly.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

export class NotConnectedError extends Error {
  constructor() { super('The data service is not connected yet.'); this.name = 'NotConnectedError'; }
}

async function call(path, options = {}) {
  const token = localStorage.getItem('fi_token');
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...options, headers });
  } catch {
    throw new NotConnectedError();
  }
  // Route not built yet (404/405) or answered by the portal's own index.html
  const type = res.headers.get('content-type') || '';
  if (res.status === 404 || res.status === 405 || !type.includes('json')) throw new NotConnectedError();
  if (!res.ok) throw new Error(`Data service error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const fetchDatasets = () => call('/datasets');
export const fetchNeededDatasets = () => call('/datasets/needed');
export const fetchMapping = (id) => call(`/datasets/${encodeURIComponent(id)}/mapping`);
export const saveMapping = (id, mapping) =>
  call(`/datasets/${encodeURIComponent(id)}/mapping`, { method: 'PUT', body: JSON.stringify({ mapping }) });
export const validateRows = (id, rows) =>
  call(`/datasets/${encodeURIComponent(id)}/validate`, { method: 'POST', body: JSON.stringify({ rows }) });
export const commitRows = (id, rows) =>
  call(`/datasets/${encodeURIComponent(id)}/records`, { method: 'POST', body: JSON.stringify({ rows }) });
