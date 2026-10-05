/**
 * cropMonitoringApi.js
 * API client for the crop-specific monitoring endpoints.
 *
 * Crop types: ffb | oil_palm | sugarcane | rice | cocoa | cassava | maize | rubber | cashew
 *
 * Each crop returns only the indices relevant to that crop's physiology.
 * E.g. sugarcane uses NDMI/LSWI/WDI for moisture; rice uses NDWI for flood detection.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

function handleTenantAuthFailure() {
  localStorage.removeItem('fi_token');
  localStorage.removeItem('fi_user');
  localStorage.removeItem('fi_tenant');
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('fi_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !path.includes('/auth/login')) {
    handleTenantAuthFailure();
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} – ${path}: ${text}`);
  }
  return res.json();
}

/**
 * GET /crop-monitoring/indices?crop_type={cropType}
 * Returns ordered list of relevant indices + descriptions for the given crop.
 * @param {string} cropType  e.g. "ffb", "sugarcane", "rice"
 */
export async function fetchCropIndices(cropType = 'ffb') {
  return apiFetch(`/crop-monitoring/indices?crop_type=${cropType}`);
}

/**
 * GET /crop-monitoring/blocks?crop_type={cropType}
 * Returns all plots/blocks with current index values for the given crop type.
 * Each block has: id, plot_nb, estate, area_ha, geometry (GeoJSON Polygon),
 * current_indices, health_class, water_stress_class, yield_t_ha, etc.
 * @param {string} cropType
 */
export async function fetchCropBlocks(cropType = 'ffb') {
  return apiFetch(`/crop-monitoring/blocks?crop_type=${cropType}`);
}

/**
 * GET /crop-monitoring/summary?crop_type={cropType}
 * Returns farm-level summary statistics and available index list.
 * @param {string} cropType
 */
export async function fetchCropSummary(cropType = 'ffb') {
  return apiFetch(`/crop-monitoring/summary?crop_type=${cropType}`);
}

/**
 * GET /crop-monitoring/timeseries?crop_type={cropType}&index={index}&lat={lat}&lon={lon}
 * Returns pixel-level weekly time series from the Zarr archive for a given crop + index.
 * @param {object} params
 * @param {string} params.cropType  e.g. "ffb", "sugarcane"
 * @param {string} params.index     e.g. "ndvi", "ndmi", "lswi"
 * @param {number} params.lat
 * @param {number} params.lon
 */
export async function fetchCropTimeseries({ cropType = 'ffb', index = 'ndvi', lat, lon }) {
  const params = new URLSearchParams({ crop_type: cropType, index, lat: lat.toString(), lon: lon.toString() });
  return apiFetch(`/crop-monitoring/timeseries?${params}`);
}

// ─── Crop type metadata used by the frontend ──────────────────────────────────

export const CROP_META = {
  ffb: {
    label: 'Oil Palm (FFB)',
    module: 'rs-ffb',
    primaryIndex: 'ndvi',
    moistureIndex: 'lswi',
    color: '#16A34A',
    indices: ['ndvi', 'evi', 'reci', 'lswi', 'wdi', 'ndre', 'cvi', 'ndmi', 'msi'],
  },
  oil_palm: {
    label: 'Oil Palm',
    module: 'rs-ffb',
    primaryIndex: 'ndvi',
    moistureIndex: 'lswi',
    color: '#16A34A',
    indices: ['ndvi', 'evi', 'reci', 'lswi', 'wdi', 'ndre', 'cvi', 'ndmi', 'msi'],
  },
  sugarcane: {
    label: 'Sugarcane',
    module: 'rs-sugarcane',
    primaryIndex: 'ndvi',
    moistureIndex: 'ndmi', // MDWI / NDMI for cane moisture
    color: '#CA8A04',
    indices: ['ndvi', 'evi', 'ndmi', 'lswi', 'wdi', 'reci', 'savi', 'lai', 'msavi2'],
  },
  rice: {
    label: 'Rice',
    module: 'rs-rice',
    primaryIndex: 'ndvi',
    moistureIndex: 'ndwi', // NDWI for flooded paddy detection
    color: '#0891B2',
    indices: ['ndvi', 'ndwi', 'evi', 'lai', 'ndmi', 'gndvi', 'msi'],
  },
  cocoa: {
    label: 'Cocoa',
    module: 'rs-cocoa',
    primaryIndex: 'ndvi',
    moistureIndex: 'ndmi',
    color: '#92400E',
    indices: ['ndvi', 'lai', 'reci', 'cvi', 'evi', 'ndmi', 'msi'],
  },
  cassava: {
    label: 'Cassava',
    module: 'rs-cassava',
    primaryIndex: 'ndvi',
    moistureIndex: 'ndmi',
    color: '#7C3AED',
    indices: ['ndvi', 'evi', 'ndmi', 'lai', 'msavi2', 'msi'],
  },
  maize: {
    label: 'Maize',
    module: 'rs-maize',
    primaryIndex: 'ndvi',
    moistureIndex: 'ndmi',
    color: '#D97706',
    indices: ['ndvi', 'evi', 'lai', 'ndmi', 'reci', 'gndvi', 'msi'],
  },
  rubber: {
    label: 'Rubber',
    module: 'rs-rubber',
    primaryIndex: 'ndvi',
    moistureIndex: 'lswi',
    color: '#64748B',
    indices: ['ndvi', 'evi', 'reci', 'lswi', 'ndmi', 'msi'],
  },
  cashew: {
    label: 'Cashew',
    module: 'rs-cashew',
    primaryIndex: 'ndvi',
    moistureIndex: 'ndwi',
    color: '#B45309',
    indices: ['ndvi', 'evi', 'ndwi', 'reci', 'ndmi', 'gndvi', 'msi'],
  },
};
