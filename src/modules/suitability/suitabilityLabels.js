/** Plain words for suitability classes and run status, and the 8 crops (identity only). */

export const CLASSES = [
  { key: 'S1', label: 'Well suited', tone: 'good', bar: 'bg-green-700' },
  { key: 'S2', label: 'Suited', tone: 'good', bar: 'bg-green-400' },
  { key: 'S3', label: 'Marginal', tone: 'warning', bar: 'bg-amber-400' },
  { key: 'N', label: 'Not suited', tone: 'critical', bar: 'bg-red-500' },
];
const EXTRA = { N1: 'Not suited now (fixable with investment)', N2: 'Not suited' };
export const classLabel = (k) => EXTRA[k] || CLASSES.find((c) => c.key === k)?.label || k || '—';
export const classTone = (k) => (String(k).startsWith('N') ? 'critical' : CLASSES.find((c) => c.key === k)?.tone || 'neutral');

export const RUN_STATUS = {
  completed: ['Ready', 'good'],
  done: ['Ready', 'good'],
  running: ['Running', 'info'],
  queued: ['Waiting', 'warning'],
  pending_pipeline_execution: ['Waiting for the pipeline', 'warning'],
  failed: ['Failed', 'critical'],
};
export const runStatus = (s) => RUN_STATUS[s] || [s || 'Unknown', 'neutral'];
export const isFinished = (s) => ['completed', 'done', 'failed'].includes(s);

// Thresholds, variants and advice come from Admin → Map classes and suitability;
// only names and photos live here.
export const CROPS = [
  { id: 'oil_palm', admin: 'ffb', name: 'Oil palm', photo: '/crops/oil_palm.webp' },
  { id: 'cocoa', admin: 'cocoa', name: 'Cocoa', photo: '/crops/cocoa.webp' },
  { id: 'rubber', admin: 'rubber', name: 'Rubber', photo: '/crops/rubber.webp' },
  { id: 'cashew', admin: 'cashew', name: 'Cashew', photo: '/crops/cashew.webp' },
  { id: 'maize', admin: 'maize', name: 'Maize', photo: '/crops/maize.webp' },
  { id: 'rice', admin: 'rice', name: 'Rice', photo: '/crops/rice.webp' },
  { id: 'cassava', admin: 'cassava', name: 'Cassava', photo: '/crops/cassava.webp' },
  { id: 'sugarcane', admin: 'sugarcane', name: 'Sugarcane', photo: '/crops/sugarcane.webp' },
];
export const cropName = (id) => CROPS.find((c) => c.id === id || c.admin === id)?.name || id;

/** Which admin advice applies to a limiting factor. */
export function adviceFor(factor, actions = {}) {
  const f = String(factor || '').toLowerCase();
  if (/slope|terrain/.test(f)) return actions.slope;
  if (/rain|dry season|water|drought/.test(f)) return actions.rainfall;
  if (/ph|acid|soil|texture|depth/.test(f)) return actions.soil_ph;
  if (/flood|waterlog|drain/.test(f)) return actions.drainage;
  return null;
}
