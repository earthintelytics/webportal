import { redirectToTenantSignIn } from './session';
/**
 * organizationMonitorApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend API client for the Farmintelytics Django Ninja backend.
 * Base path: /farmintelytics-engine/agromonitoring
 * Every function is async and returns the parsed JSON response.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import proj4 from 'proj4';
import { API_BASE } from './apiBase';


function handleTenantAuthFailure() {
  const isAdmin = Boolean(localStorage.getItem('fi_admin_token'));
  if (isAdmin) {
    // Do not wipe admin sessions or redirect if an auxiliary tenant data call fails
    return;
  }
  redirectToTenantSignIn();
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
 * @param {string} [tenant] the organisation whose sign-in page is used; other organisations' accounts are refused
 * @returns {{ token, email, status, message }}
 */
export async function login(email, accessCode, tenant = null) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, access_code: accessCode, ...(tenant ? { tenant } : {}) }),
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
// The service being viewed: estates whose boundary is set for other services only are left out.
const serviceParam = () => { try { const m = sessionStorage.getItem('fi_module'); return m ? `module=${encodeURIComponent(m)}` : ''; } catch { return ''; } };

export async function fetchPlotsIntelligence(tenant) {
  const q = [tenant ? `tenant=${tenant}` : '', serviceParam()].filter(Boolean).join('&');
  return apiFetch(`/plots/intelligence${q ? `?${q}` : ''}`);
}

// ─── Crop Health Analytics ──────────────────────────────────────────────────

// ─── Crop Yield Forecasting ─────────────────────────────────────────────────

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

// ─── Certificate & Reports ──────────────────────────────────────────────────

/**
 * POST /api/reports
 * Creates a report grounded in multidimensional indices, timeseries, and AI decision intelligence.
 */
export async function createReport(payload) {
  return apiFetch('/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/reports
 * Returns list of generated reports for the tenant.
 */
export async function fetchReportsHistory() {
  return apiFetch('/reports');
}

/**
 * POST /api/reports/ai-recommendations
 * Generates on-demand decision intelligence recommendations for reports.
 */
export async function fetchAiReportRecommendations(payload) {
  return apiFetch('/reports/ai-recommendations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── AI Assistant ────────────────────────────────────────────────────────────

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
  const q = serviceParam();
  return apiFetch(`/farm/boundary${q ? `?${q}` : ''}`);
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

// ─── Specialized ESG & Sustainability Services ──────────────────────────────

