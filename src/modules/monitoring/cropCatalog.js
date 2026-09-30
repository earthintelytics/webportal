/**
 * Crop page sets — interim copy until the backend catalogue answers
 * (GET /crop-monitoring/catalogue/{crop}; admin-editable, FINDINGS G5/D11).
 * From each crop document in docs/crops ("Portal pages and main page"),
 * mapped onto the shared layout's page kinds, in farmer words. Land
 * restoration and EUDR are services now, so they are not crop pages.
 *
 * sidebar ids: analytics, intelligence-layers, crop-health, crop-yield,
 * moisture-content, climate, alerts. analytics ids: overview, vigor-health,
 * moisture-et, et-log, water-management, soil-nutrients.
 */
const base = (extra = {}) => ({
  sidebar: [
    { id: 'analytics', label: 'Farm overview' },
    { id: 'intelligence-layers', label: 'Map' },
    { id: 'crop-health', label: 'Crop health' },
    { id: 'moisture-content', label: 'Water' },
    { id: 'climate', label: 'Weather' },
    { id: 'alerts', label: 'Alerts' },
  ],
  analytics: [
    { id: 'overview', label: 'Overview' },
    { id: 'vigor-health', label: 'Crop health' },
    { id: 'moisture-et', label: 'Water' },
  ],
  ...extra,
});

export const CROP_CATALOG = {
  oil_palm: base({
    overviewTitle: 'Estate overview', overviewText: 'How the palms are doing across the estate, which blocks need action, and the yield trend.',
    sidebar: [
      { id: 'analytics', label: 'Estate overview' }, { id: 'intelligence-layers', label: 'Map' }, { id: 'crop-health', label: 'Palm health' },
      { id: 'moisture-content', label: 'Water' }, { id: 'crop-yield', label: 'Yield trend' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
  }),
  cocoa: base({ overviewTitle: 'Farm overview', overviewText: 'Canopy health, dry-season water stress and the farms that need a visit.' }),
  rubber: base({
    overviewTitle: 'Plantation overview', overviewText: 'Leaf cover through wintering and refoliation, water stress, and blocks that need attention.',
    sidebar: [
      { id: 'analytics', label: 'Plantation overview' }, { id: 'intelligence-layers', label: 'Map' }, { id: 'crop-health', label: 'Leaf cover' },
      { id: 'moisture-content', label: 'Water' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
  }),
  cashew: base({
    overviewTitle: 'Orchard overview', overviewText: 'Orchard health, flowering-season weather and water.',
    sidebar: [
      { id: 'analytics', label: 'Orchard overview' }, { id: 'intelligence-layers', label: 'Map' }, { id: 'crop-health', label: 'Orchard health' },
      { id: 'climate', label: 'Flowering weather' }, { id: 'moisture-content', label: 'Water' }, { id: 'alerts', label: 'Alerts' },
    ],
  }),
  maize: base({
    overviewTitle: 'Farm overview', overviewText: 'Establishment, leaf colour for top-dressing, water at tasselling, and the yield outlook.',
    sidebar: [
      { id: 'analytics', label: 'Farm overview' }, { id: 'intelligence-layers', label: 'Map' }, { id: 'crop-health', label: 'Early growth and crop health' },
      { id: 'moisture-content', label: 'Water' }, { id: 'crop-yield', label: 'Yield outlook' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }, { id: 'vigor-health', label: 'Crop health' }, { id: 'moisture-et', label: 'Water' }, { id: 'water-management', label: 'Irrigation' }],
  }),
  rice: base({
    overviewTitle: 'Farm overview', overviewText: 'Flooding in the paddies, crop health, and the fields that need water or nitrogen.',
    sidebar: [
      { id: 'analytics', label: 'Farm overview' }, { id: 'intelligence-layers', label: 'Map' }, { id: 'moisture-content', label: 'Flooding' },
      { id: 'crop-health', label: 'Crop health' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }, { id: 'vigor-health', label: 'Crop health' }, { id: 'moisture-et', label: 'Flooding and water' }],
  }),
  cassava: base({ overviewTitle: 'Farm overview', overviewText: 'Establishment, leaf cover and long droughts.' }),
  sugarcane: base({
    overviewTitle: 'Estate overview', overviewText: 'Growth, water through grand growth and drying off, irrigation demand and the yield outlook.',
    sidebar: [
      { id: 'analytics', label: 'Estate overview' }, { id: 'intelligence-layers', label: 'Map' }, { id: 'crop-health', label: 'Cane health' },
      { id: 'moisture-content', label: 'Water' }, { id: 'crop-yield', label: 'Yield outlook' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }, { id: 'vigor-health', label: 'Cane health' }, { id: 'moisture-et', label: 'Water' }, { id: 'water-management', label: 'Irrigation' }, { id: 'et-log', label: 'Water demand log' }],
  }),
};

// Organisation dashboards (all crops and estates in one view): same farmer
// wording; land restoration and EUDR are services, not dashboard pages.
export const ORGANISATION_PAGES = {
  overviewTitle: 'Organisation overview',
  overviewText: 'How every estate is doing, what changed and which blocks need action.',
  sidebar: [
    { id: 'analytics', label: 'Overview' }, { id: 'intelligence-layers', label: 'Map' }, { id: 'crop-health', label: 'Crop health' },
    { id: 'moisture-content', label: 'Water' }, { id: 'crop-yield', label: 'Yield trend' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
  ],
  analytics: [
    { id: 'overview', label: 'Overview' }, { id: 'vigor-health', label: 'Crop health' }, { id: 'moisture-et', label: 'Water' },
    { id: 'water-management', label: 'Irrigation' }, { id: 'soil-nutrients', label: 'Soil' },
  ],
};

const BACKEND_KEY = { oil_palm: 'ffb' };
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

/** Catalogue entry for a crop: backend first (admin-editable), interim copy otherwise. */
export async function loadCropPages(cropType) {
  if (!cropType) return null;
  const token = localStorage.getItem('fi_token');
  try {
    const res = await fetch(`${API_BASE}/crop-monitoring/catalogue/${BACKEND_KEY[cropType] || cropType}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
      const d = await res.json();
      if (Array.isArray(d?.sidebar) && d.sidebar.length) return d;
    }
  } catch { /* backend catalogue not deployed yet */ }
  return CROP_CATALOG[cropType] || null;
}
