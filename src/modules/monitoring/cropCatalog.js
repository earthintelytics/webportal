/**
 * Crop page sets — interim copy until the backend catalogue answers
 * (GET /crop-monitoring/catalogue/{crop}; admin-editable, FINDINGS G5/D11).
 * From each crop monitoring document in docs/services ("Portal pages and main page"),
 * mapped onto the shared layout's page kinds, in farmer words without redundant map tabs.
 *
 * sidebar ids: analytics, crop-health, crop-yield, moisture-content, climate, alerts.
 * analytics ids: overview, vigor-health, moisture-et, et-log, water-management, soil-nutrients.
 */
const base = (extra = {}) => ({
  sidebar: [
    { id: 'analytics', label: 'Farm overview' },
    { id: 'crop-health', label: 'Crop health' },
    { id: 'moisture-content', label: 'Water & moisture' },
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
      { id: 'analytics', label: 'Estate overview' }, { id: 'crop-health', label: 'Palm health' },
      { id: 'moisture-content', label: 'Water' }, { id: 'crop-yield', label: 'Yield trend' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
  }),
  cocoa: base({ 
    overviewTitle: 'Farm overview', 
    overviewText: 'Canopy health, dry-season water stress and the farms that need a visit.',
    sidebar: [
      { id: 'analytics', label: 'Cocoa overview' },
      { id: 'crop-health', label: 'Canopy condition' },
      { id: 'moisture-content', label: 'Water deficit' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Alerts' },
    ],
  }),
  rubber: base({
    overviewTitle: 'Plantation overview', overviewText: 'Leaf cover through wintering and refoliation, water stress, and blocks that need attention.',
    sidebar: [
      { id: 'analytics', label: 'Plantation overview' }, { id: 'crop-health', label: 'Leaf cover & vigor' },
      { id: 'moisture-content', label: 'Tapping moisture' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
  }),
  cashew: base({
    overviewTitle: 'Orchard overview', overviewText: 'Orchard health, flowering-season weather and water.',
    sidebar: [
      { id: 'analytics', label: 'Orchard overview' }, { id: 'crop-health', label: 'Orchard health' },
      { id: 'climate', label: 'Flowering weather' }, { id: 'moisture-content', label: 'Water' }, { id: 'alerts', label: 'Alerts' },
    ],
  }),
  maize: base({
    overviewTitle: 'Farm overview', overviewText: 'Establishment, leaf colour for top-dressing, water at tasselling, and the yield outlook.',
    sidebar: [
      { id: 'analytics', label: 'Farm overview' }, { id: 'crop-health', label: 'Early growth & vigor' },
      { id: 'moisture-content', label: 'Water stress' }, { id: 'crop-yield', label: 'Yield outlook' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }, { id: 'vigor-health', label: 'Crop health' }, { id: 'moisture-et', label: 'Water' }, { id: 'water-management', label: 'Irrigation' }],
  }),
  rice: base({
    overviewTitle: 'Farm overview', overviewText: 'Flooding in the paddies, crop health, and the fields that need water or nitrogen.',
    sidebar: [
      { id: 'analytics', label: 'Paddy overview' }, { id: 'moisture-content', label: 'Flooding & water' },
      { id: 'crop-health', label: 'Paddy vigor' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }, { id: 'vigor-health', label: 'Crop health' }, { id: 'moisture-et', label: 'Flooding and water' }],
  }),
  cassava: base({ 
    overviewTitle: 'Farm overview', 
    overviewText: 'Establishment, tuber canopy leaf cover and long drought monitoring.',
    sidebar: [
      { id: 'analytics', label: 'Tuber overview' },
      { id: 'crop-health', label: 'Canopy vigor' },
      { id: 'moisture-content', label: 'Rootzone moisture' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Alerts' },
    ]
  }),
  sugarcane: base({
    overviewTitle: 'Estate overview', overviewText: 'Growth, water through grand growth and drying off, irrigation demand and the yield outlook.',
    sidebar: [
      { id: 'analytics', label: 'Estate overview' }, { id: 'crop-health', label: 'Cane health' },
      { id: 'moisture-content', label: 'Water' }, { id: 'crop-yield', label: 'Yield outlook' }, { id: 'climate', label: 'Weather' }, { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }, { id: 'vigor-health', label: 'Cane health' }, { id: 'moisture-et', label: 'Water' }, { id: 'water-management', label: 'Irrigation' }, { id: 'et-log', label: 'Water demand log' }],
  }),
};

const BACKEND_KEY = { oil_palm: 'ffb' };
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';

/** Catalogue entry for a crop: backend first (admin-editable), interim copy otherwise. */
export async function loadCropPages(cropType) {
  if (!cropType) return null;
  const token = localStorage.getItem('fi_token');
  const cropId = BACKEND_KEY[cropType] || cropType;
  try {
    const res = await fetch(`${API_BASE}/crop-monitoring/catalogue/${encodeURIComponent(cropId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.sidebar && data.sidebar.length > 0) return data;
    }
  } catch {
    // offline or catalogue endpoint not reachable: fall through to interim copy
  }
  return CROP_CATALOG[cropType] || base();
}
