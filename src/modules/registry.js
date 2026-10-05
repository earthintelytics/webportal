/**
 * The one place that says what each module ID opens (`/portal/<id>`).
 *
 * Every portal is resolved here and nowhere else, so a page can never fall
 * through to another kind of page: an ID that is not listed opens nothing.
 *
 *   kind  crop          a crop monitoring portal (CropDashboardLayout, crop catalogue)
 *         service       a service in CropDashboardLayout (modules/services/serviceCatalog.js)
 *         smallholder   the Smallholder hub (its cards open services)
 *         suitability   the suitability tool (FarmIntelytics team only)
 *   teamOnly            only a team session may open it; clients receive its reports
 */
import { SERVICE_CATALOG } from './services/serviceCatalog';

const CROPS = {
  'rs-ffb': 'Oil palm monitoring',
  'rs-cashew': 'Cashew monitoring',
  'rs-sugarcane': 'Sugarcane monitoring',
  'rs-rice': 'Rice monitoring',
  'rs-cocoa': 'Cocoa monitoring',
  'rs-rubber': 'Rubber monitoring',
  'rs-cassava': 'Cassava monitoring',
  'rs-maize': 'Maize monitoring',
};

// Old IDs still found in links and organisation settings.
const ALIASES = {
  'group-management': 'smallholder-hub',
};

// Services reached from the Smallholder hub; licensing any of them opens the hub.
export const SMALLHOLDER_SERVICES = ['group-monitoring', 'carbon-groups', 'smallholder-members', 'smallholder-forms', 'smallholder-eudr'];

export const canonicalModuleId = (id) => ALIASES[id] || id;

/** → { id, kind, name, teamOnly } or null when the ID is not a module. */
export function resolveModule(rawId) {
  const id = canonicalModuleId(rawId);
  if (!id) return null;
  if (CROPS[id]) return { id, kind: 'crop', name: CROPS[id], teamOnly: false };
  if (id === 'suitability-tool') return { id, kind: 'suitability', name: 'Crop suitability', teamOnly: true };
  if (id === 'smallholder-hub') return { id, kind: 'smallholder', name: 'Smallholder', teamOnly: false };
  if (SERVICE_CATALOG[id]) return { id, kind: 'service', name: SERVICE_CATALOG[id].title, teamOnly: false };
  return null;
}

/** Display name for sign-in pages; organisation dashboards get their own name. */
export function moduleName(id) {
  if (!id) return null;
  if (id.startsWith('custom-agromonitor-')) {
    const words = id.replace('custom-agromonitor-', '').split(/[_-]+/).filter(Boolean);
    return `${words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} monitoring`;
  }
  return resolveModule(id)?.name || null;
}
