/**
 * Estates of the signed-in organisation — contract in docs/WORK_SPLIT.md
 * ("Estates"). Built by the backend team; until GET /estates exists the
 * portal falls back to the estate names carried by the plots.
 */
import { NotConnectedError } from './datasetsApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

export async function fetchEstates() {
  const token = localStorage.getItem('fi_token');
  let res;
  try {
    res = await fetch(`${API_BASE}/estates`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new NotConnectedError();
  }
  if (res.status === 404 || res.status === 405 || !(res.headers.get('content-type') || '').includes('json')) throw new NotConnectedError();
  if (!res.ok) throw new Error(`Estates error ${res.status}`);
  return res.json();
}
