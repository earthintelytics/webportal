import { redirectToTenantSignIn } from './session';
import { API_BASE } from './apiBase';
/**
 * cropMonitoringApi.js
 * API client for the crop-specific monitoring endpoints.
 *
 * Crop types: ffb | oil_palm | sugarcane | rice | cocoa | cassava | maize | rubber | cashew
 *
 * Each crop returns only the indices relevant to that crop's physiology.
 * E.g. sugarcane uses NDMI/LSWI/WDI for moisture; rice uses NDWI for flood detection.
 */


function handleTenantAuthFailure() {
  redirectToTenantSignIn();
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

// ─── Crop type metadata used by the frontend ──────────────────────────────────

