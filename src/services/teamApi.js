/**
 * The organisation's own team (contract "Team" in docs/WORK_SPLIT.md, G35).
 * Until the backend ships it every call rejects with NotConnectedError and the
 * settings page says so; nothing is kept only in the browser.
 */
import { NotConnectedError } from './datasetsApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

async function call(path, options = {}) {
  const token = localStorage.getItem('fi_token');
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new NotConnectedError();
  }
  if (res.status === 404 || res.status === 405 || !(res.headers.get('content-type') || '').includes('json')) {
    throw new NotConnectedError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.message || `Team service error ${res.status}`);
  }
  return res.json();
}

export const fetchTeam = () => call('/team');
export const addTeamMember = (member) => call('/team', { method: 'POST', body: JSON.stringify(member) });
export const updateTeamMember = (id, member) => call(`/team/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(member) });
export const removeTeamMember = (id) => call(`/team/${encodeURIComponent(id)}`, { method: 'DELETE' });
