import { SERVICE_GROUPS } from '../../../constants/servicePhotos';
import { CROP_LABELS } from '../../components/orgConstants';

// Services a monitoring run produces results for: crop monitoring, the
// sustainability checks and the smallholder parcel services. Not the advisor,
// drone uploads, the member register or internal sub-module ids.
const RUN_SERVICES = new Set(['carbon-ffb', 'forestry-intel', 'carbon-estimator', 'land-restoration', 'eudr-check', 'group-monitoring', 'carbon-groups', 'smallholder-eudr']);
export function runnableServiceOptions(org) {
  return licensedServiceOptions(org).filter((o) => (o.id.startsWith('rs-') && o.id !== 'rs-drone') || RUN_SERVICES.has(o.id));
}

// The organisation's licensed services, with plain names.
export function licensedServiceOptions(org) {
  const named = Object.fromEntries(SERVICE_GROUPS.flatMap((g) => g.services.map((s) => [s.id, s.label])));
  return (org.allowed_modules || []).map((id) => ({
    id,
    label: named[id] || (id.startsWith('rs-') ? `${CROP_LABELS[id.slice(3)] || id.slice(3)} monitoring` : id),
  }));
}

