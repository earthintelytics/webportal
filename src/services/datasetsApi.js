import { API_BASE } from './apiBase';
/**
 * Client data (open questions and calibration) — contract in docs/WORK_SPLIT.md,
 * "Client data". Endpoints are built by the backend team; until they exist
 * every call rejects with NotConnectedError and the UI says so honestly.
 */

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
export const saveMapping = (id, mapping) =>
  call(`/datasets/${encodeURIComponent(id)}/mapping`, { method: 'PUT', body: JSON.stringify({ mapping }) });
// Rows already mapped to our column names travel as a CSV file: the backend
// validates uploaded files today, while JSON `rows` are ignored (G41).
function rowsAsCsv(rows) {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v) => { const t = v == null ? '' : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'rows.csv');
  form.append('mapping', '{}');
  return form;
}
export const validateRows = (id, rows) =>
  call(`/datasets/${encodeURIComponent(id)}/validate`, { method: 'POST', body: rowsAsCsv(rows) });
export const commitRows = (id, rows) =>
  call(`/datasets/${encodeURIComponent(id)}/records`, { method: 'POST', body: rowsAsCsv(rows) });
