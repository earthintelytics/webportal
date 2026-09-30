/**
 * AI settings, usage and limits (super admin). Contract: docs/WORK_SPLIT.md,
 * "AI settings (G13)". Built by the backend team; until the endpoints exist
 * every call rejects with AiNotConnected and the page says so.
 */
const BASE = import.meta.env.VITE_ADMIN_API_BASE_URL || '/farmintelytics-engine/admin';

export class AiNotConnected extends Error { constructor() { super('AI settings service not connected yet'); this.name = 'AiNotConnected'; } }

async function call(path, options = {}) {
  const token = localStorage.getItem('fi_admin_token');
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch { throw new AiNotConnected(); }
  if (res.status === 404 || res.status === 405 || !(res.headers.get('content-type') || '').includes('json')) throw new AiNotConnected();
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || body?.error?.message || `Error ${res.status}`);
  return body;
}

export const fetchAiSettings = () => call('/ai/settings');
export const saveAiSettings = (data) => call('/ai/settings', { method: 'PUT', body: JSON.stringify(data) });
export const saveAiProvider = (id, data) => call(`/ai/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const testAiProvider = (id) => call(`/ai/providers/${id}/test`, { method: 'POST' });
export const saveAiPrices = (prices) => call('/ai/prices', { method: 'PUT', body: JSON.stringify({ prices }) });
export const fetchAiUsage = ({ from, to, group }) => call(`/ai/usage?${new URLSearchParams({ from, to, group })}`);
export const fetchAiLimits = () => call('/ai/limits');
export const saveAiLimits = (data) => call('/ai/limits', { method: 'PUT', body: JSON.stringify(data) });
