/**
 * The signed-in organisation as stored at sign-in (Login.jsx), and the
 * services it is licensed for. Only services granted at onboarding appear;
 * there is no generic organisation dashboard.
 */
import { SMALLHOLDER_SERVICES } from '../../modules/registry';
import { CROP_PHOTOS, SERVICE_PHOTOS } from '../../constants/servicePhotos';

const readJson = (key) => {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(v) ? v : []; } catch { return []; }
};

export function readOrgProfile() {
  const get = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const tenant = get('fi_tenant');
  const max = Number(get('fi_max_accounts'));
  return {
    tenant,
    name: get('fi_display_name') || tenant,
    email: get('fi_email'),
    fullName: get('fi_full_name'),
    role: (get('fi_role') || 'admin').toLowerCase(),
    logoUrl: get('fi_logo_url'),
    modules: readJson('fi_allowed_modules'),
    crops: readJson('fi_allowed_crops'),
    maxAccounts: Number.isFinite(max) && max > 0 ? max : null,
  };
}

export const ROLES = [
  { id: 'admin', label: 'Admin', text: 'Everything in their services, plus this team and the logo' },
  { id: 'analyst', label: 'Analyst', text: 'Monitoring, reports, uploads and the Assistant' },
  { id: 'viewer', label: 'Viewer', text: 'Read only: monitoring, reports and the Assistant' },
];
export const roleLabel = (id) => ROLES.find((r) => r.id === String(id || '').toLowerCase())?.label || id || 'Admin';

const crop = (id, title, text) => ({ id, title, text, group: 'crops', photo: CROP_PHOTOS[id.replace('rs-', '')] });
const svc = (id, title, text, group) => ({ id, title, text, group, photo: SERVICE_PHOTOS[id] || '/crops/smallholder.webp' });

export const ORG_SERVICES = [
  crop('rs-ffb', 'Oil palm', 'Condition, water, weather and alerts for every block.'),
  crop('rs-rubber', 'Rubber', 'Canopy condition, leaf change and tapping conditions.'),
  crop('rs-cocoa', 'Cocoa', 'Canopy condition, stress and farm boundaries.'),
  crop('rs-rice', 'Rice', 'Flooding, growth stage and condition per field.'),
  crop('rs-maize', 'Maize', 'Condition, water stress and growth through the season.'),
  crop('rs-cassava', 'Cassava', 'Condition, stress and time to harvest.'),
  crop('rs-sugarcane', 'Sugarcane', 'Growth, water shortage and ripening per field.'),
  crop('rs-cashew', 'Cashew', 'Orchard condition, flowering weather and new growth.'),
  svc('eudr-check', 'EUDR check', 'Where each plot is and whether forest was cleared after 2020.', 'sustainability'),
  svc('carbon-ffb', 'Estate carbon', 'Carbon held by the estate and land-use change since the baseline.', 'sustainability'),
  svc('forestry-intel', 'Forestry', 'Forest condition, clearing and disturbance.', 'sustainability'),
  svc('carbon-estimator', 'Carbon estimator', 'Carbon a site could hold under different plans.', 'sustainability'),
  svc('land-restoration', 'Land restoration', 'Degraded land and how it recovers.', 'sustainability'),
  svc('smallholder-hub', 'Smallholder', 'Members and parcels, farmer forms, farm monitoring, group carbon and EUDR.', 'advisory'),
  svc('advisor', 'Farm advisor', 'Advice for each field from your monitoring data and the weather.', 'advisory'),
  svc('rs-drone', 'Drone surveys', 'Drone surveys next to the latest satellite view.', 'engine'),
];

export const SERVICE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'crops', label: 'Crop monitoring' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'advisory', label: 'Field advisory' },
  { id: 'engine', label: 'Engine' },
];

export function licensedServices(profile) {
  const mods = new Set(profile.modules);
  const crops = new Set(profile.crops);
  return ORG_SERVICES.filter((s) => {
    if (mods.has(s.id)) return true;
    if (s.group === 'crops') return crops.has(s.id.replace('rs-', ''));
    if (s.id === 'smallholder-hub') return SMALLHOLDER_SERVICES.some((id) => mods.has(id)) || mods.has('group-management');
    return false;
  });
}
