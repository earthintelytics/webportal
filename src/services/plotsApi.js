import { redirectToTenantSignIn } from './session';
/**
 * plotsApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * API client for plot-level spatial data, raster outputs, GeoParquet ledgers,
 * and filter-aware GeoJSON boundary endpoints.
 *
 * These endpoints are produced by the farmintelytics-data-pipeline and served
 * via the backend router (monitoring/router/plots.py).
 *
 * Onboarding filter keys (e.g. plot_nb, estate, name, block_id) are set by
 * the super-admin when onboarding a tenant. Any such key can be passed as a
 * query param and the backend will filter all results dynamically.
 *
 * Base path: /farmintelytics-engine/agromonitoring
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

function handleAuthFailure() {
  const isAdmin = Boolean(localStorage.getItem('fi_admin_token'));
  if (isAdmin) return;
  redirectToTenantSignIn();
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('fi_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { cache: 'no-store', ...options, headers });
  if (res.status === 401 && !path.includes('/auth/login')) handleAuthFailure();
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} – ${path}: ${text}`);
  }
  return res.json();
}

// ─── Plot Boundaries / GeoJSON ───────────────────────────────────────────────

/**
 * GET /plots/geojson
 * Returns the full plots FeatureCollection with all 11 optical indices as
 * properties. Accepts any admin-configured onboarding filter keys as query
 * params (e.g. ?plot_nb=Block+1A&estate=Main+Estate).
 *
 * @param {Object} [filters]  Key/value onboarding filter pairs, e.g. { estate: 'North Estate' }
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
export async function fetchPlotsGeoJSON(filters = {}) {
  const params = new URLSearchParams(filters);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/plots/geojson${qs}`);
}

/**
 * GET /plots/health
 * Returns health-enriched plot features (ndvi, reci, ndmi, stress classes…).
 * Accepts the same dynamic filter keys as /plots/geojson.
 *
 * @param {Object} [filters]
 * @returns {Promise<Array>}
 */
export async function fetchPlotsHealth(filters = {}) {
  const params = new URLSearchParams(filters);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/plots/health${qs}`);
}

/**
 * GET /plots/intelligence
 * Returns plot intelligence items (composite index snapshot, estate, boundary).
 * Accepts the same dynamic filter keys.
 *
 * @param {Object} [filters]
 * @returns {Promise<Array>}
 */
export async function fetchPlotsIntelligence(filters = {}) {
  const params = new URLSearchParams(filters);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/plots/intelligence${qs}`);
}

// ─── GeoParquet Ledger ────────────────────────────────────────────────────────

/**
 * GET /plots/geoparquet
 * Streams the plot_indices.parquet binary (application/vnd.apache.parquet).
 * Returns a Blob so callers can create a download URL via URL.createObjectURL.
 *
 * Useful for GIS clients (QGIS, geopandas) and the frontend's data export.
 *
 * @returns {Promise<Blob>}
 */
export async function fetchPlotsGeoParquet() {
  const url = `${API_BASE}/plots/geoparquet`;
  const token = localStorage.getItem('fi_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { cache: 'no-store', headers });
  if (res.status === 401) handleAuthFailure();
  if (!res.ok) throw new Error(`GeoParquet fetch failed: ${res.status}`);
  return res.blob();
}

/**
 * Helper: trigger a browser download of the GeoParquet file.
 * @param {string} [filename]  Override filename (default: plot_indices.parquet)
 */
export async function downloadPlotsGeoParquet(filename = 'plot_indices.parquet') {
  const blob = await fetchPlotsGeoParquet();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Raster / Zarr Status ─────────────────────────────────────────────────────

/**
 * GET /plots/raster-status
 * Returns real-time availability of all spatial outputs for the tenant:
 *   - zarr_stores:        list of Zarr archive names in MinIO
 *   - raster_count:       number of COG GeoTIFF rasters in staging
 *   - has_geoparquet:     boolean — plot_indices.parquet exists
 *   - has_geojson:        boolean — plots_health.geojson exists
 *   - visualization_ready: boolean — at least one Zarr + one raster available
 *   - vector_ready:       boolean — geojson + parquet both present
 *
 * @returns {Promise<Object>}
 */
export async function fetchPlotsRasterStatus() {
  return apiFetch('/plots/raster-status');
}

// ─── Crop Monitoring (filter-aware) ──────────────────────────────────────────

/**
 * GET /crop-monitoring/summary
 * Returns farm-level summary with optional live recalculation when filter keys
 * are passed. When ?estate=X is passed, total_plots, total_area_ha, and
 * average_indices are recalculated exclusively for matching plots.
 *
 * @param {string}  [cropType]  e.g. 'ffb', 'rice', 'cocoa'
 * @param {Object}  [filters]   Onboarding filter pairs, e.g. { estate: 'North Estate' }
 * @returns {Promise<Object>}
 */
export async function fetchCropSummaryFiltered(cropType = 'ffb', filters = {}) {
  const params = new URLSearchParams({ crop_type: cropType, ...filters });
  return apiFetch(`/crop-monitoring/summary?${params}`);
}

/**
 * GET /crop-monitoring/blocks
 * Returns all plot blocks with current index values, filtered by any
 * onboarding key. E.g. ?plot_nb=Block+1A returns only that block.
 *
 * @param {string}  [cropType]
 * @param {Object}  [filters]   e.g. { plot_nb: 'Block 1A' } or { estate: 'North Estate' }
 * @returns {Promise<Array>}
 */
export async function fetchCropBlocksFiltered(cropType = 'ffb', filters = {}) {
  const params = new URLSearchParams({ crop_type: cropType, ...filters });
  return apiFetch(`/crop-monitoring/blocks?${params}`);
}

/**
 * GET /crop-monitoring/indices
 * Returns ordered index list + descriptions for the given crop type.
 *
 * @param {string} cropType
 * @returns {Promise<Array>}
 */
export async function fetchCropIndices(cropType = 'ffb') {
  return apiFetch(`/crop-monitoring/indices?crop_type=${cropType}`);
}

// ─── Suitability (all 8 crops) ────────────────────────────────────────────────

/**
 * GET /suitability/crops
 * Returns all 8 registered crop suitability definitions.
 *
 * @returns {Promise<Array>}
 */
export async function fetchSuitabilityCrops() {
  return apiFetch('/suitability/crops');
}

/**
 * GET /suitability/catalogue/{crop}
 * Returns the full suitability catalogue entry for one crop.
 *
 * @param {string} crop  e.g. 'oil_palm', 'rice', 'cocoa'
 * @returns {Promise<Object>}
 */
export async function fetchSuitabilityCatalogue(crop) {
  return apiFetch(`/suitability/catalogue/${encodeURIComponent(crop)}`);
}

/**
 * GET /suitability/companies/{companyId}/summary
 * Returns the company-level suitability summary derived from live climate +
 * restoration telemetry (no mock data).
 *
 * @param {string} companyId  tenant slug / schema_name
 * @returns {Promise<Object>}
 */
export async function fetchSuitabilitySummary(companyId) {
  return apiFetch(`/suitability/companies/${encodeURIComponent(companyId)}/summary`);
}

/**
 * GET /suitability/map?company_id={companyId}&crop={crop}
 * Returns per-plot fuzzy suitability scores for map rendering.
 *
 * @param {string} companyId
 * @param {string} [crop]  optional crop filter
 * @returns {Promise<Object>}
 */
export async function fetchSuitabilityMap(companyId, crop = '') {
  const params = new URLSearchParams({ company_id: companyId });
  if (crop) params.set('crop', crop);
  return apiFetch(`/suitability/map?${params}`);
}

/**
 * POST /suitability/run
 * Queues a suitability pipeline run for the given company and optional crop.
 *
 * @param {{ company_id: string, crop?: string }} payload
 * @returns {Promise<Object>}
 */
export async function triggerSuitabilityRun(payload) {
  return apiFetch('/suitability/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── AI Advisor ───────────────────────────────────────────────────────────────

/**
 * POST /ai/query
 * Sends a question to the AI advisor (LangGraph agent grounded on pipeline data).
 *
 * @param {string} question  Natural-language farm management question
 * @returns {Promise<{ response: string, sources: string[], sections: Object[] }>}
 */
export async function queryAdvisor(question) {
  return apiFetch('/ai/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

/**
 * POST /chat/ask
 * Sends a message to the agronomic AI assistant (Chat UI endpoint).
 *
 * @param {{ message: string, scenario?: string }} payload
 * @returns {Promise<{ response: string }>}
 */
export async function askAdvisorChat(payload) {
  return apiFetch('/chat/ask', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Alerts (filter-aware) ────────────────────────────────────────────────────

/**
 * GET /alerts
 * Returns alert feed and KPI counts for the authenticated tenant.
 * Accepts onboarding filter keys to narrow alerts to a specific estate/block.
 *
 * @param {Object} [filters]  e.g. { estate: 'Main Estate' }
 * @returns {Promise<{ stats: Object, feed: Array }>}
 */
export async function fetchAlerts(filters = {}) {
  const params = new URLSearchParams(filters);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/alerts${qs}`);
}

/**
 * POST /alerts/{alertId}/acknowledge
 * Acknowledges an active alert.
 *
 * @param {string} alertId
 * @returns {Promise<Object>}
 */
export async function acknowledgeAlert(alertId) {
  return apiFetch(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'POST' });
}

// ─── ESG / Services Summary ───────────────────────────────────────────────────

/**
 * GET /services/summary
 * Returns the unified ESG portfolio (carbon, atmospheric, forest, WDPA, water, restoration).
 *
 * @param {string} [tenantSlug]  Optional override; server resolves from token by default.
 * @returns {Promise<Object>}
 */
export async function fetchServicesSummary(tenantSlug = null) {
  const qs = tenantSlug ? `?tenant_slug=${encodeURIComponent(tenantSlug)}` : '';
  return apiFetch(`/services/summary${qs}`);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /dashboard/stats
 * Returns executive KPI cards: total_area_ha, active_imagery_source,
 * average_carbon_density_tco2e_ha, active_alerts_count, audit_status.
 *
 * @returns {Promise<Object>}
 */
export async function fetchDashboardStats() {
  return apiFetch('/dashboard/stats');
}

/**
 * GET /dashboard/trends
 * Returns ndvi_vigor_trends, moisture_comparison, nutrient_profile,
 * land_use_classification for chart rendering.
 *
 * @returns {Promise<Object>}
 */
export async function fetchDashboardTrends() {
  return apiFetch('/dashboard/trends');
}
