/**
 * Front-end validation for admin forms. The backend validates again; these
 * give the admin a plain message before anything is sent.
 */
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
export const emailError = (v) => (!String(v || '').trim() ? 'Enter an email address.' : isEmail(v) ? null : 'This does not look like an email address.');
export const slugError = (v) => (!v ? null : /^[a-z0-9][a-z0-9_]{1,49}$/.test(v) ? null : 'Use lowercase letters, numbers and underscores (2–50 characters, starting with a letter or number).');
export const accessCodeError = (v) => (!v ? null : String(v).length >= 8 ? null : 'Use at least 8 characters, or leave it blank to generate one.');

const POLY = new Set(['Polygon', 'MultiPolygon']);
/**
 * Checks a parsed boundary file: must be GeoJSON with at least one polygon,
 * coordinates in longitude/latitude range. Returns { error, polygons, features }.
 */
export function boundaryCheck(geojson, sizeBytes = 0) {
  if (!geojson || typeof geojson !== 'object') return { error: 'The file is not valid GeoJSON.' };
  const feats = geojson.type === 'FeatureCollection' ? (geojson.features || [])
    : geojson.type === 'Feature' ? [geojson]
      : POLY.has(geojson.type) ? [{ geometry: geojson }] : null;
  if (!feats) return { error: `Expected a FeatureCollection, Feature or Polygon, found "${geojson.type || 'unknown'}".` };
  const polys = feats.filter(f => POLY.has(f?.geometry?.type));
  if (!polys.length) return { error: 'The file has no polygons. Upload the outline of the estate (Polygon or MultiPolygon).' };
  // First coordinate must look like longitude/latitude (catches projected files, e.g. UTM metres)
  let c = polys[0].geometry.coordinates;
  while (Array.isArray(c) && Array.isArray(c[0])) c = c[0];
  if (!Array.isArray(c) || Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90) return { error: 'Coordinates are not longitude/latitude. Re-export the file in WGS 84 (EPSG:4326).' };
  const warning = sizeBytes > 20 * 1024 * 1024 ? `Large file (${Math.round(sizeBytes / 1048576)} MB): uploads and previews will be slow on weak connections.` : null;
  return { error: null, warning, polygons: polys.length, features: feats.length };
}
