import { SERVICE_GROUPS } from '../../../constants/servicePhotos';
import { CROP_LABELS } from '../../components/orgConstants';

// The organisation's licensed services, with plain names.
export function licensedServiceOptions(org) {
  const named = Object.fromEntries(SERVICE_GROUPS.flatMap((g) => g.services.map((s) => [s.id, s.label])));
  return (org.allowed_modules || []).map((id) => ({
    id,
    label: named[id] || (id.startsWith('rs-') ? `${CROP_LABELS[id.slice(3)] || id.slice(3)} monitoring` : id),
  }));
}

