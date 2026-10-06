/**
 * Suitability API client (contract SU1 in docs/WORK_SPLIT.md).
 * Suitability is a FarmIntelytics team tool: every call uses the team
 * (superadmin) token. Failures are thrown, never replaced by invented results.
 */
import { NotConnectedError } from '../../services/datasetsApi';

const BASE_URL = '/farmintelytics-engine/agromonitoring/suitability';

const authHeaders = () => {
  const token = localStorage.getItem('fi_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

async function call(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers: authHeaders() });
  } catch {
    throw new NotConnectedError();
  }
  if (res.status === 404 || res.status === 405 || !(res.headers.get('content-type') || '').includes('json')) {
    throw new NotConnectedError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Suitability service error ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return res.json();
}

const q = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();

export const fetchCompanies = async () => {
  const data = await call('/companies');
  return Array.isArray(data) ? data : [];
};

export const fetchSuitabilityRuns = async (companyId, cropId = null) => {
  const data = await call(`/runs?${q({ company_id: companyId, crop: cropId })}`);
  return Array.isArray(data) ? data : [];
};

export const fetchSuitabilityRun = (runId) => call(`/runs/${encodeURIComponent(runId)}`);

export const submitSuitabilityRun = (payload) => call('/runs', { method: 'POST', body: JSON.stringify(payload) });

export const generateReportPdf = (runId) =>
  call(`/runs/${encodeURIComponent(runId)}/report/pdf`, { method: 'POST' });
