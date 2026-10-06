import { hasValidTeamToken, redirectToTeamSignIn } from './session';
import { ADMIN_API_BASE } from './apiBase';
/**
 * AI settings, usage and limits (super admin). Contract: docs/WORK_SPLIT.md,
 * "AI settings (G13)". Built by the backend team; until the endpoints exist
 * every call rejects with AiNotConnected and the page says so.
 */
const BASE = ADMIN_API_BASE;

export class AiNotConnected extends Error { constructor() { super('AI settings service not connected yet'); this.name = 'AiNotConnected'; } }

async function call(path, options = {}) {
  const token = localStorage.getItem('fi_admin_token');
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch { throw new AiNotConnected(); }
  if (res.status === 401 || (res.status === 403 && !hasValidTeamToken())) { redirectToTeamSignIn(); throw new Error('Please sign in again.'); }
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
// from/to per the contract; from_date/to_date as the current backend reads them
export const fetchAiUsage = ({ from, to, group }) => call(`/ai/usage?${new URLSearchParams({ from, to, from_date: from, to_date: to, group })}`);
export const fetchAiLimits = () => call('/ai/limits');
export const saveAiLimits = (data) => call('/ai/limits', { method: 'PUT', body: JSON.stringify(data) });
