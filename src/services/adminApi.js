import { hasValidTeamToken, redirectToTeamSignIn } from './session';
import { trackChange } from '../farmintelytics-admin/components/activityBus';
import { ADMIN_API_BASE } from './apiBase';
/**
 * adminApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * API client for the FarmIntelytics Super Admin Portal backend.
 * Base path: /farmintelytics-engine/admin
 * Token stored separately from the regular tenant token.
 * ─────────────────────────────────────────────────────────────────────────────
 */


// A 401 here always means the stored superadmin token is missing/expired/
// invalid (see _require_admin on the backend) — every admin page used to
// just surface the raw "Invalid or expired token" JSON as a generic error
// banner, leaving a signed-out user stuck staring at a broken page instead
// of being sent back to log in.
const handleAdminAuthFailure = redirectToTeamSignIn;

/**
 * Admin API call. Changes (POST/PUT/PATCH/DELETE, except signing in) show the
 * console's progress bar and a "Saved" or "Not saved" message.
 */
function adminFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isChange = method !== 'GET' && !path.startsWith('/auth/');
  return isChange ? trackChange(rawAdminFetch(path, options), { success: method === 'DELETE' ? 'Removed' : 'Saved' }) : rawAdminFetch(path, options);
}

async function rawAdminFetch(path, options = {}) {
  const url = `${ADMIN_API_BASE}${path}`;
  const token = localStorage.getItem('fi_admin_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { cache: 'no-store', ...options, headers });
  const requestId = res.headers.get('X-Request-ID');
  // 401, or 403 with an outdated team token: sign in again.
  if (res.status === 401 || (res.status === 403 && !hasValidTeamToken())) handleAdminAuthFailure();
  if (!res.ok) {
    const text = await res.text();
    let msg;
    let code = 'ERROR';
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        msg = parsed;
      } else if (parsed.error && typeof parsed.error === 'object') {
        msg = parsed.error.message || JSON.stringify(parsed.error);
        code = parsed.error.code || 'ERROR';
      } else if (parsed.message) {
        msg = parsed.message;
      } else if (parsed.error) {
        msg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      } else if (parsed.detail) {
        if (Array.isArray(parsed.detail)) {
          msg = parsed.detail.map(d => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join('; ');
        } else {
          msg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } else {
        msg = text;
      }
    } catch {
      // An HTML page (proxy or server "Not Found") is never shown to the user.
      const isHtml = /^\s*<(!doctype|html)/i.test(text);
      if (res.status === 404 || res.status === 405) {
        msg = 'This part of the backend is not available on this server yet.';
        code = 'NOT_CONNECTED';
      } else if (isHtml || !text) {
        msg = `The server could not complete the request (error ${res.status}). Try again in a moment.`;
      } else {
        msg = text;
      }
    }
    const err = new Error(msg);
    err.status = res.status;
    err.code = code;
    err.path = path;
    err.requestId = requestId;
    err.raw = text;
    throw err;
  }
  const json = await res.json();
  // Support both enveloped and direct payloads
  if (json && typeof json === 'object' && json.status === 'success' && json.data !== undefined) {
    return json.data;
  }
  return json;
}

/** Multipart upload helper with XMLHttpRequest progress tracking */
function adminUpload(path, formData, onProgress = null) {
  const url = `${ADMIN_API_BASE}${path}`;
  const token = localStorage.getItem('fi_admin_token');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress({ loaded: e.loaded, total: e.total, percent: pct });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        handleAdminAuthFailure();
        return reject(new Error('Unauthorized'));
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress({ loaded: 100, total: 100, percent: 100 });
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Admin Upload ${xhr.status} – ${path}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function adminLogin(email, accessCode) {
  return adminFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, access_code: accessCode }),
  });
}

// ─── Team accounts (owners only) ─────────────────────────────────────────────

export const fetchTeamAccounts = () => adminFetch('/team-accounts');
export const createTeamAccount = (data) => adminFetch('/team-accounts', { method: 'POST', body: JSON.stringify(data) });
export const updateTeamAccount = (id, data) => adminFetch(`/team-accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const newTeamAccountCode = (id) => adminFetch(`/team-accounts/${id}/new-code`, { method: 'POST' });
export const deleteTeamAccount = (id) => adminFetch(`/team-accounts/${id}`, { method: 'DELETE' });

// ─── Organizations ────────────────────────────────────────────────────────────

export async function fetchOrganizations() {
  return adminFetch('/organizations');
}

export async function createOrganization(data) {
  return adminFetch('/organizations', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateOrganization(id, data) {
  return adminFetch(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function uploadOrganizationLogo(id, file) {
  const form = new FormData();
  form.append('file', file);
  return adminUpload(`/organizations/${id}/logo`, form);
}

export async function deleteOrganization(id) {
  return adminFetch(`/organizations/${id}`, { method: 'DELETE' });
}

// ─── Farms ────────────────────────────────────────────────────────────────────

export async function fetchFarms(companyId) {
  const qs = companyId ? `?company_id=${companyId}` : '';
  return adminFetch(`/farms${qs}`);
}

export async function createFarm(data) {
  return adminFetch('/farms', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateFarm(farmId, data) {
  return adminFetch(`/farms/${farmId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteFarm(farmId) {
  return adminFetch(`/farms/${farmId}`, { method: 'DELETE' });
}

/**
 * POST /farms/{farm_id}/generate-config
 * Renders a ready-to-run pipeline batch YAML from the farm registry entry and
 * writes it into the shared pipeline configs folder.
 * Returns { status, filename, boundary_expected_at, boundary_uploaded, content }.
 */
export async function generateFarmConfig(farmId) {
  return adminFetch(`/farms/${farmId}/generate-config`, { method: 'POST' });
}

/**
 * POST /farms/parent/{parent_farm_id}/generate-config
 * Same as generateFarmConfig, but for a parent farm made of several
 * sub-farms sharing one parent_farm_id (e.g. Okomu's mainestate/
 * extension1/extension2) — emits ONE batch YAML with one job per sub-farm.
 * Returns { status, filename, sub_farms, content }.
 */
export async function generateParentConfig(parentFarmId) {
  return adminFetch(`/farms/parent/${parentFarmId}/generate-config`, { method: 'POST' });
}

// ─── Boundaries ───────────────────────────────────────────────────────────────

export async function uploadBoundary(farmId, file, onProgress = null) {
  const form = new FormData();
  form.append('file', file);
  return adminUpload(`/boundaries/${farmId}`, form, onProgress);
}

/**
 * GET /boundaries/{farm_id}/properties
 * Introspects the just-uploaded boundary's real GeoJSON property keys (e.g.
 * Estate, Crop, CodeBloc) so onboarding can offer them as dashboard filter
 * choices without guessing column names ahead of upload.
 * Returns { farm_id, properties: [{ key, sample_values }] }.
 */
export async function getBoundaryProperties(farmId) {
  return adminFetch(`/boundaries/${farmId}/properties`);
}

// ─── Credentials ──────────────────────────────────────────────────────────────

export async function fetchCredentials(companyId) {
  const qs = companyId ? `?company_id=${companyId}` : '';
  return adminFetch(`/credentials${qs}`);
}

export async function createCredential(data) {
  return adminFetch('/credentials', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteCredential(id) {
  return adminFetch(`/credentials/${id}`, { method: 'DELETE' });
}

export async function rotateCredential(id) {
  return adminFetch(`/credentials/${id}/rotate`, { method: 'POST' });
}

// ─── Crop Index Thresholds (agronomist calibration) ──────────────────────────

/**
 * GET /crop-thresholds?crop_type=rice&company_id=
 * Effective legend classes for every index in the crop's profile, each flagged
 * `calibrated` (saved calibration) or not (shipped science-based default).
 */
export async function fetchCropThresholds(cropType, companyId = '') {
  const p = new URLSearchParams({ crop_type: cropType });
  if (companyId) p.set('company_id', companyId);
  return adminFetch(`/crop-thresholds?${p}`);
}

/** PUT /crop-thresholds — save a calibration for one crop × index */
export async function saveCropThreshold(data) {
  return adminFetch('/crop-thresholds', { method: 'PUT', body: JSON.stringify(data) });
}

/** DELETE /crop-thresholds — reset one crop × index back to the default */
export async function resetCropThreshold(cropType, indexKey, companyId = '') {
  const p = new URLSearchParams({ crop_type: cropType, index_key: indexKey });
  if (companyId) p.set('company_id', companyId);
  return adminFetch(`/crop-thresholds?${p}`, { method: 'DELETE' });
}

export async function fetchSuitabilityThresholds(cropType, companyId = '') {
  const p = new URLSearchParams({ crop_type: cropType });
  if (companyId) p.set('company_id', companyId);
  return adminFetch(`/suitability-thresholds?${p}`);
}

export async function saveSuitabilityThreshold(data) {
  return adminFetch('/suitability-thresholds', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function fetchLogs({ status, sensor, search, page = 1, pageSize = 50 } = {}) {
  const p = new URLSearchParams({ page, page_size: pageSize });
  if (status) p.set('status', status);
  if (sensor) p.set('sensor', sensor);
  if (search) p.set('search', search);
  return adminFetch(`/logs?${p}`);
}

export async function fetchPipelineLogs(companyId, limit = 20) {
  const p = new URLSearchParams({ limit });
  if (companyId) p.set('company_id', companyId);
  return adminFetch(`/logs/pipeline?${p}`);
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export async function fetchSchedulerJobs() {
  return adminFetch('/scheduler');
}

export async function createSchedulerJob(data) {
  return adminFetch('/scheduler', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSchedulerJob(name, data) {
  return adminFetch(`/scheduler/${name}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteSchedulerJob(name) {
  return adminFetch(`/scheduler/${name}`, { method: 'DELETE' });
}


// ─── Pipeline Configs ─────────────────────────────────────────────────────────

export async function fetchPipelineConfigs() {
  return adminFetch('/pipeline-configs');
}

export async function fetchPipelineConfigContent(filename) {
  return adminFetch(`/pipeline-configs/${filename}`);
}

export async function savePipelineConfig(data) {
  return adminFetch('/pipeline-configs', { method: 'POST', body: JSON.stringify(data) });
}

export async function deletePipelineConfig(filename) {
  return adminFetch(`/pipeline-configs/${filename}`, { method: 'DELETE' });
}


// ─── MinIO & Postgres Sync ───────────────────────────────────────────────────

export async function fetchMinioInventory(companyId, farmId) {
  const p = new URLSearchParams();
  if (companyId) p.set('company_id', companyId);
  if (farmId) p.set('farm_id', farmId);
  const qs = p.toString() ? `?${p}` : '';
  return adminFetch(`/minio/inventory${qs}`);
}

export async function fetchMinioObjectContent(key) {
  return adminFetch(`/minio/object-content?key=${encodeURIComponent(key)}`);
}

export async function syncDatabaseWithMinio() {
  return adminFetch('/minio/sync-database', { method: 'POST' });
}

export async function deleteMinioObject(key) {
  return adminFetch('/minio/delete-object', {
    method: 'POST',
    body: JSON.stringify({ key }),
  });
}


// ─── Users / Account Management ───────────────────────────────────────────────

export async function fetchUsers({ accountType, search, page = 1, pageSize = 50 } = {}) {
  const p = new URLSearchParams({ page, page_size: pageSize });
  if (accountType) p.set('account_type', accountType);
  if (search)      p.set('search', search);
  return adminFetch(`/users?${p}`);
}

export async function createUser(data) {
  return adminFetch('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(userId, data) {
  return adminFetch(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function toggleUserActive(userId) {
  return adminFetch(`/users/${userId}/toggle-active`, { method: 'PATCH' });
}

export async function resetUserPassword(userId, password = null) {
  return adminFetch(`/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(password ? { password } : {}),
  });
}

export async function deleteUser(userId) {
  return adminFetch(`/users/${userId}`, { method: 'DELETE' });
}



// ── Pipeline jobs (G27) ─────────────────────────────────────────────────────
/** POST /admin/scheduler/{name}/run — start a scheduled site now → { job_id } */
export async function runSchedulerJob(name) {
  return adminFetch(`/scheduler/${encodeURIComponent(name)}/run`, { method: 'POST' });
}

/** GET /admin/jobs?company_id=&status=&kind=&limit= — every organisation's jobs */
export async function fetchAdminJobs({ companyId = '', status = '', kind = '', limit = 100 } = {}) {
  const p = new URLSearchParams(Object.entries({ company_id: companyId, status, kind, limit }).filter(([, v]) => v !== '' && v != null));
  return adminFetch(`/jobs?${p}`);
}

/** POST /admin/jobs/{id}/retry → { job_id } */
export async function retryAdminJob(id) {
  return adminFetch(`/jobs/${encodeURIComponent(id)}/retry`, { method: 'POST' });
}
