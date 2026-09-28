/**
 * organizationMonitorApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend API client for the Farmintelytics Django Ninja backend.
 * Base path: /farmintelytics-engine/agromonitoring
 * Every function is async and returns the parsed JSON response.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import proj4 from 'proj4';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

function handleTenantAuthFailure() {
  localStorage.removeItem('fi_token');
  localStorage.removeItem('fi_user');
  localStorage.removeItem('fi_tenant');
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

/** Generic fetch helper with JSON parsing and error handling */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('fi_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
  });
  if (res.status === 401 && !path.includes('/auth/login')) {
    handleTenantAuthFailure();
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} – ${path}: ${text}`);
  }
  return res.json();
}

// ─── Authentication ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * @param {string} email
 * @param {string} accessCode
 * @returns {{ token, email, status, message }}
 */
export async function login(email, accessCode) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, access_code: accessCode }),
  });
}

/**
 * POST /api/auth/verify
 * @param {string} token
 * @returns {{ valid: boolean, user_info }}
 */
export async function verifyToken(token) {
  return apiFetch('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/stats
 * Returns executive KPI cards:
 *   total_area_ha, active_imagery_source, average_carbon_density_tco2e_ha,
 *   active_alerts_count, audit_status
 */
export async function fetchDashboardStats(tenant) {
  const params = tenant ? `?tenant=${tenant}` : '';
  return apiFetch(`/dashboard/stats${params}`);
}

/**
 * GET /api/dashboard/trends?tenant={tenant}
 * Returns charting datasets:
 *   ndvi_vigor_trends[]   → for the 6-month NDVI line chart
 *   moisture_comparison[] → NDMI bar chart (matches plotsData field ndmi)
 *   nutrient_profile      → radar chart labels + values
 *   land_use_classification[] → doughnut chart segments
 */
export async function fetchDashboardTrends(tenant) {
  const params = tenant ? `?tenant=${tenant}` : '';
  return apiFetch(`/dashboard/trends${params}`);
}

// ─── Intelligence Layers ────────────────────────────────────────────────────

/**
 * GET /api/plots/intelligence/
 * Returns plot boundaries + composite indices for the Intelligence Layers map.
 * Each item: { plot_id, name, estate, boundary, indices: { ndvi, ndmi, chlorophyll, uas_anomaly_score } }
 *
 * Frontend field mapping:
 *   plot_id              → id  (PLOT-ALPHA / PLOT-BETA / PLOT-GAMMA)
 *   name                 → name
 *   indices.ndvi         → ndvi
 *   indices.ndmi         → ndmi
 *   indices.chlorophyll  → chlorophyll
 *   indices.uas_anomaly_score → uas_anomaly_score
 *   boundary.coordinates → coords (after lat/lng swap – see note below)
 */
export async function fetchPlotsIntelligence(tenant) {
  const params = tenant ? `?tenant=${tenant}` : '';
  return apiFetch(`/plots/intelligence${params}`);
}

// ─── Crop Health Analytics ──────────────────────────────────────────────────

/**
 * GET /api/plots/health/?date={date}&plot_id={plot_id}
 * Returns health indices per plot.
 * Each item: { plot_id, indices: { ndvi, chlorophyll, water_stress, pest_risk } }
 *
 * Frontend field mapping:
 *   indices.ndvi         → ndvi
 *   indices.chlorophyll  → chlorophyll
 *   indices.water_stress → waterStress
 *   indices.pest_risk    → pestRisk  ("Low Risk" | "Moderate Risk" | "High Risk")
 *
 * @param {string} [date]    ISO date string e.g. "2026-06-01"
 * @param {string} [plotId]  e.g. "PLOT-ALPHA"
 */
export async function fetchPlotsHealth({ date, plotId } = {}) {
  const params = new URLSearchParams();
  if (date)   params.set('date', date);
  if (plotId) params.set('plot_id', plotId);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/plots/health${qs}`);
}

// ─── Crop Yield Forecasting ─────────────────────────────────────────────────

/**
 * GET /api/plots/yield/forecast/?date={date}&plot_id={plot_id}
 * Returns yield forecasts per plot.
 * Each item: { plot_id, yield_rate_ton_ha, projected_yield_tons, biomass_index,
 *              harvest_readiness_pct, confidence_accuracy }
 *
 * Frontend field mapping:
 *   yield_rate_ton_ha    → yieldValue
 *   projected_yield_tons → predictedYield
 *   biomass_index        → biomass (EVI-derived)
 *   harvest_readiness_pct → readiness
 *   confidence_accuracy  → predAccuracy
 *
 * @param {string} [date]
 * @param {string} [plotId]
 */
export async function fetchPlotsYieldForecast({ date, plotId } = {}) {
  const params = new URLSearchParams();
  if (date)   params.set('date', date);
  if (plotId) params.set('plot_id', plotId);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/plots/yield/forecast${qs}`);
}

// ─── Crop Water Demand (FAO-56) ─────────────────────────────────────────────

export async function fetchPlotsWaterDemand({ date, plotId } = {}) {
  const params = new URLSearchParams();
  if (date)   params.set('date', date);
  if (plotId) params.set('plot_id', plotId);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/plots/water-demand${qs}`);
}

// ─── Climate & Sensor Telemetry ─────────────────────────────────────────────

/**
 * GET /api/plots/telemetry/?date={date}&plot_id={plot_id}
 * Returns microclimate sensor data per plot.
 * Each item: { plot_id, rainfall_mm, soil_temp_celsius, surface_lst_celsius, vpd_kpa }
 *
 * Frontend field mapping:
 *   rainfall_mm          → rainfall
 *   soil_temp_celsius    → soilTemp
 *   surface_lst_celsius  → lst
 *   vpd_kpa              → vpd
 *
 * @param {string} [date]
 * @param {string} [plotId]
 */
export async function fetchPlotsTelemetry({ date, plotId } = {}) {
  const params = new URLSearchParams();
  if (date)   params.set('date', date);
  if (plotId) params.set('plot_id', plotId);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/plots/telemetry${qs}`);
}

// ─── Land Restoration & Agroforestry ────────────────────────────────────────

/**
 * GET /api/restoration/zones/
 * Returns restoration zone data.
 * Each item: { zone_id, name, project_type, progress_pct, survival_rate_pct,
 *              tree_count, carbon_offset_tco2e, biodiversity_score, manager, boundary }
 *
 * Frontend field mapping:
 *   zone_id              → id
 *   progress_pct         → progress
 *   survival_rate_pct    → survivalNum
 *   tree_count           → trees
 *   carbon_offset_tco2e  → carbon
 *   biodiversity_score   → biodiversity_score
 *   manager              → manager
 */
export async function fetchRestorationZones(tenant) {
  const params = tenant ? `?tenant=${tenant}` : '';
  return apiFetch(`/restoration/zones${params}`);
}

/**
 * GET /restoration/land-use-change
 * ESA WorldCover year-over-year land-cover classification change for this
 * tenant (tenant resolved server-side from the Bearer token). Returns {}
 * when WorldCover doesn't cover this farm or only one year is available —
 * that's a valid "no data yet" state, not an error.
 * { compared_years: [2020, 2021], land_cover_by_year: { [year]: { [className]: pct } },
 *   changed_pct: number, top_transitions: [{ transition, area_pct }] }
 */
export async function fetchLandUseChange() {
  return apiFetch('/restoration/land-use-change');
}

// ─── Alerts Command Center ──────────────────────────────────────────────────

/**
 * GET /api/alerts/
 * Returns incident feed and KPI counts.
 * { stats: { total, critical, warnings, acknowledged }, feed: AlertItem[] }
 *
 * AlertItem: { alert_id, plot_id, type, severity, message, timestamp,
 *              acknowledged, acknowledged_by, acknowledged_at }
 */
export async function fetchAlerts(tenant) {
  const params = tenant ? `?tenant=${tenant}` : '';
  return apiFetch(`/alerts${params}`);
}

/**
 * POST /api/alerts/{alert_id}/acknowledge
 * Acknowledges an active alert and records the user.
 * @param {string} alertId  e.g. "ALT-001"
 * @returns {{ status, alert_id, acknowledged_by, acknowledged_at }}
 */
export async function acknowledgeAlert(alertId) {
  return apiFetch(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
}

// ─── Verification (Intentionally blank for now) ─────────────────────────────

/**
 * GET /api/verification/audit/?plot_id={plot_id}
 * NOTE: The verification page is intentionally left blank/empty.
 * This endpoint returns { overall_compliance: true, checks: [], logs: [] }.
 * Wire this in later when the page is implemented.
 *
 * @param {string} [plotId]
 */
export async function fetchVerificationAudit(plotId) {
  if (!plotId) throw new Error('plotId is required');
  return apiFetch(`/verification/audit?plot_id=${plotId}`);
}

// ─── Certificate & Reports ──────────────────────────────────────────────────

/**
 * POST /api/reports/certificate
 * Generates a cryptographic MRV certificate with SHA-256 hash.
 * @param {{ scope: string, metric: string, plot_id?: string }} payload
 *   scope:   "Whole Farm (Aggregate)" | "Plot-Level"
 *   metric:  "NDVI" | "NDMI" | "NDWI" | "SOC" | "AGB"
 *   plot_id: optional, e.g. "PLOT-ALPHA"
 * @returns {{ certificate_id, hash, blockchain_status, data_points, diagnostic_summary, … }}
 */
export async function generateCertificate(payload) {
  return apiFetch('/reports/certificate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/reports/list
 * Returns list of pre-compiled environmental reports.
 * Each item: { report_id, title, metric, scope, plot_id, generated_at, download_url }
 */
export async function fetchReportsList() {
  return apiFetch('/reports/list');
}

// ─── AI Assistant ────────────────────────────────────────────────────────────

/**
 * POST /api/chat/ask
 * Sends a message to the AI assistant and returns a contextual response.
 * @param {{ message: string, scenario?: string }} payload
 *   scenario: "Climate-Smart Agriculture" | "Land Restoration" |
 *             "Carbon Registry" | "Traceability"
 * @returns {{ response: string, sources: string[] }}
 */
export async function askAiAssistant(payload) {
  return apiFetch('/chat/ask', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Coordinate Helper ───────────────────────────────────────────────────────

// Define standard projections: WGS84 (EPSG:4326) and Web Mercator (EPSG:3857)
const EPSG4326 = 'EPSG:4326';
const EPSG3857 = 'EPSG:3857';
proj4.defs(EPSG4326, '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs(EPSG3857, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs');

/**
 * Transforms coordinates between EPSG:4326 and EPSG:3857 using proj4
 * @param {[number, number]} coord - The coordinate pair to transform
 * @param {string} from - Source projection name
 * @param {string} to - Target projection name
 * @returns {[number, number]} Transformed coordinate pair
 */
export function transformCoordinate(coord, from = EPSG4326, to = EPSG3857) {
  return proj4(from, to, coord);
}

/**
 * Converts GeoJSON [lng, lat] pairs (already EPSG:4326, the GeoJSON
 * standard) into Leaflet-compatible [lat, lng] pairs. This is purely an
 * axis-order swap, not a reprojection — no proj4 transform is needed
 * (or was actually happening: this used to call
 * proj4(EPSG4326, EPSG4326, coord), a no-op identity transform whose
 * comment claimed it "guarantees projection standards and avoids
 * coordinate shift", which misdescribed what the code does and would
 * mislead anyone debugging a real coordinate issue here). If a source
 * ever supplies boundaries in a different CRS, reproject with
 * transformCoordinate() before calling this, not inside it.
 *
 * Usage:
 *   const coords = geoJsonToLeaflet(plot.boundary.coordinates[0]);
 *
 * @param {Array<[number, number]>} geoJsonRing  Array of [lng, lat] from GeoJSON
 * @returns {Array<[number, number]>}             Array of [lat, lng] for Leaflet
 */
export function geoJsonToLeaflet(geoJsonRing) {
  return geoJsonRing.map(([lng, lat]) => [lat, lng]);
}

/**
 * GET /tenants
 * Returns list of dynamic tenants/organizations.
 * @returns {Promise<Array<{id: string, title: string, crop: string, active: boolean}>>}
 */
export async function fetchTenants() {
  return apiFetch('/tenants');
}

/**
 * GET /crop-monitoring/config
 * Returns active tenant crop permissions and map settings.
 * @returns {Promise<{tenant: string, display_name: string, allowed_crops: string[], map_center: [number, number], modules: string[]}>}
 */
export async function fetchCropMonitoringConfig() {
  return apiFetch('/crop-monitoring/config');
}

/**
 * GET /timeseries/slider/?farm={farm}&index={index}&start={start}&end={end}&sensor={sensor}&load_delay={delay}
 * Returns timeseries slider URLs and stats.
 * @param {Object} options
 * @param {string} options.farm - Farm identifier
 * @param {string} options.index - Index name (e.g., 'ndvi', 'ndmi')
 * @param {string} [options.start] - Start date (ISO format)
 * @param {string} [options.end] - End date (ISO format)
 * @param {string} [options.sensor] - Data source (e.g., 'sentinel', 'landsat')
 * @param {number} [options.loadDelay] - Delay in seconds before returning (allows data to load)
 */
export async function fetchTimeseriesSlider({ farm, index, start, end, sensor, cropType, loadDelay = 0 } = {}) {
  const params = new URLSearchParams({ farm, index });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (sensor) params.set('sensor', sensor);
  // crop_type makes the tile server colour rasters with the crop-specific
  // legend classes, so map colours match the legend cards exactly
  if (cropType) params.set('crop_type', cropType);
  if (loadDelay > 0) params.set('load_delay', loadDelay.toString());
  return apiFetch(`/timeseries/slider?${params}`);
}

/**
 * GET /composite-tiles/slider?farm={farm}&composite={composite}&start=&end=&sensor=
 * Timeline + tile URLs for a basemap composite (true_color | false_color | sar_rgb),
 * built from the raw bands the pipeline persists alongside each index. Same
 * {date: url} shape as fetchTimeseriesSlider, so it drives the same time-slider
 * / currentTileUrl mechanics — just pointed at a composite instead of an index.
 */
export async function fetchCompositeSlider({ farm, composite, start, end, sensor } = {}) {
  const params = new URLSearchParams({ farm, composite });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (sensor) params.set('sensor', sensor);
  return apiFetch(`/composite-tiles/slider?${params}`);
}

/**
 * GET /timeseries/calendar?farm=&start=&end=
 * Every real acquisition date across Sentinel-2, Landsat and Sentinel-1,
 * each tagged with which satellite(s) captured it — for a calendar showing
 * full imagery coverage, not just whichever sensor+index is selected.
 * Returns { dates: [{ date, sensors: [...] }], farm }.
 */
export async function fetchTimeseriesCalendar({ farm, start, end } = {}) {
  const params = new URLSearchParams({ farm: farm || 'farm_1' });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  return apiFetch(`/timeseries/calendar?${params}`);
}

/**
 * GET /timeseries/pixel/?farm={farm}&index={index}&lat={lat}&lon={lon}&load_delay={delay}
 * Returns pixel-level Zarr time series data.
 * @param {Object} options
 * @param {string} options.farm - Farm identifier
 * @param {string} options.index - Index name (e.g., 'ndvi', 'ndmi')
 * @param {number} options.lat - Latitude coordinate
 * @param {number} options.lon - Longitude coordinate
 * @param {number} [options.loadDelay] - Delay in seconds before returning (allows data to load)
 */
export async function fetchPixelTimeseries({ farm, index, lat, lon, loadDelay = 0 } = {}) {
  const params = new URLSearchParams({ farm, index, lat: lat.toString(), lon: lon.toString() });
  if (loadDelay > 0) params.set('load_delay', loadDelay.toString());
  return apiFetch(`/timeseries/pixel?${params}`);
}

/**
 * GET /farm/boundary
 * Returns a GeoJSON Feature with the farm's spatial bounding polygon
 * derived from zarr x/y extents. Used when no individual plot GeoJSONs exist.
 */
export async function fetchFarmBoundary() {
  return apiFetch('/farm/boundary');
}

/**
 * Query the LangGraph AI assistant with a natural-language question.
 * Returns { response: string, sources: string[] }
 */
export async function queryAiAgent(question) {
  return apiFetch('/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}

/**
 * GET /raster/indices
 * Lists available zarr index files for the authenticated tenant from MinIO.
 * The tenant is resolved server-side from the Bearer token — never sent by the client.
 * Returns { tenant, indices: [{ index, zarr_name, lo, hi, cmap }] }
 */
export async function fetchRasterIndices() {
  return apiFetch('/raster/indices');
}

/**
 * POST /cache/clear
 * Clear all cached zarr stores. Call after pipeline ingestion completes to force refresh.
 * @returns {{ status: string, message: string }}
 */
export async function clearCache() {
  return apiFetch('/cache/clear', { method: 'POST' });
}

/**
 * POST /cache/rebuild
 * Rebuild cache by pre-loading indices for the current tenant.
 * Clears cache first, then pre-loads frequently accessed indices.
 * @returns {{ status: string, tenant: string, rebuilt_count: number, indices: string[] }}
 */
export async function rebuildCache() {
  return apiFetch('/cache/rebuild', { method: 'POST' });
}


