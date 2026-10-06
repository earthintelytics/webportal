/**
 * Geometry helpers for form answers. Everything is sent to the server as a
 * GeoJSON geometry in longitude/latitude (WGS 84), the contract the server
 * checks (forms.py validate_geometry_answer, G54).
 */

// Area of a lon/lat ring in hectares (spherical approximation; the backend recomputes it).
export function ringAreaHa(points) {
  if (!points || points.length < 3) return 0;
  const R = 6378137, rad = Math.PI / 180;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    sum += (b.lon - a.lon) * rad * (2 + Math.sin(a.lat * rad) + Math.sin(b.lat * rad));
  }
  return Math.abs((sum * R * R) / 2) / 10000;
}

const toPts = (ring) => ring.map(([lon, lat]) => ({ lon, lat }));

/** Area in hectares of a Polygon or MultiPolygon (outer rings minus holes). */
export function geometryAreaHa(g) {
  if (!g) return 0;
  const poly = (rings) => rings.reduce((s, r, i) => s + (i === 0 ? 1 : -1) * ringAreaHa(toPts(r.slice(0, -1))), 0);
  if (g.type === 'Polygon') return poly(g.coordinates);
  if (g.type === 'MultiPolygon') return g.coordinates.reduce((s, p) => s + poly(p), 0);
  return 0;
}

/** Length in metres of a LineString. */
export function lineLengthM(g) {
  if (!g || g.type !== 'LineString') return 0;
  const R = 6371008.8, rad = Math.PI / 180;
  let m = 0;
  for (let i = 1; i < g.coordinates.length; i++) {
    const [lon1, lat1] = g.coordinates[i - 1], [lon2, lat2] = g.coordinates[i];
    const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
    m += 2 * R * Math.asin(Math.sqrt(a));
  }
  return m;
}

/** Geometry from tapped vertices [{lat, lon}] for a point, line or area field. */
export function geometryFromVertices(shape, pts) {
  if (shape === 'point') return pts[0] ? { type: 'Point', coordinates: [pts[0].lon, pts[0].lat] } : null;
  if (shape === 'line') return pts.length >= 2 ? { type: 'LineString', coordinates: pts.map((p) => [p.lon, p.lat]) } : null;
  if (pts.length < 3) return null;
  const ring = pts.map((p) => [p.lon, p.lat]);
  return { type: 'Polygon', coordinates: [[...ring, ring[0]]] };
}

/**
 * An answer as the server expects it: GPS points and walked boundaries are
 * kept on the phone as {lat, lon} / [{lat, lon}] and sent as GeoJSON here.
 */
export function toServerGeometry(v) {
  if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.lat === 'number' && typeof v.lon === 'number') {
    return { type: 'Point', coordinates: [v.lon, v.lat], accuracy_m: v.accuracy_m ?? null };
  }
  if (Array.isArray(v) && v.length && typeof v[0]?.lat === 'number') {
    return v.length >= 3 ? geometryFromVertices('area', v) : null;
  }
  return undefined; // not a geometry answer
}

// ─── Reading boundary files: GeoJSON, KML, KMZ, zipped shapefile ─────────────

const inRange = ([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;

function collectGeometries(gj) {
  const out = [];
  const walk = (o) => {
    if (!o) return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o.type === 'FeatureCollection') walk(o.features);
    else if (o.type === 'Feature') walk(o.geometry);
    else if (o.type === 'GeometryCollection') walk(o.geometries);
    else if (o.type && o.coordinates) out.push(o);
  };
  walk(gj);
  return out;
}

const drop3d = (c) => (typeof c[0] === 'number' ? [c[0], c[1]] : c.map(drop3d));

/**
 * The geometry a field wants, from everything in a file: all polygons merged
 * into one (Multi)Polygon for an area, the first line for a line, the first
 * point for a point. Throws an Error with a plain message when nothing fits.
 */
export function pickGeometry(gj, shape) {
  const geoms = collectGeometries(gj).map((g) => ({ ...g, coordinates: drop3d(g.coordinates) }));
  const flat = (g) => (g.type === 'Point' ? [g.coordinates] : g.type === 'LineString' || g.type === 'MultiPoint' ? g.coordinates : g.type === 'Polygon' || g.type === 'MultiLineString' ? g.coordinates.flat() : g.coordinates.flat(2));
  if (geoms.some((g) => !flat(g).every(inRange))) {
    throw new Error('The coordinates are not longitude and latitude. Save the file in WGS 84 (EPSG:4326), or include the .prj file in the zip.');
  }
  if (shape === 'area') {
    const polys = geoms.flatMap((g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []));
    if (!polys.length) throw new Error('No area (polygon) found in this file.');
    polys.forEach((p) => p.forEach((ring) => { const a = ring[0], b = ring[ring.length - 1]; if (a[0] !== b[0] || a[1] !== b[1]) ring.push(a); }));
    if (polys.some((p) => p[0].length < 4)) throw new Error('An area in this file has fewer than 3 corners.');
    return polys.length === 1 ? { type: 'Polygon', coordinates: polys[0] } : { type: 'MultiPolygon', coordinates: polys };
  }
  if (shape === 'line') {
    const line = geoms.find((g) => g.type === 'LineString') || geoms.find((g) => g.type === 'MultiLineString');
    if (!line) throw new Error('No line found in this file.');
    return line.type === 'LineString' ? line : { type: 'LineString', coordinates: line.coordinates[0] };
  }
  const pt = geoms.find((g) => g.type === 'Point') || geoms.find((g) => g.type === 'MultiPoint');
  if (!pt) throw new Error('No point found in this file.');
  return pt.type === 'Point' ? pt : { type: 'Point', coordinates: pt.coordinates[0] };
}

const MAX_BYTES = 20 * 1024 * 1024;

async function kmlToGeoJson(text) {
  const { kml } = await import('@tmcw/togeojson');
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('The KML file could not be read.');
  return kml(doc);
}

/**
 * Reads a boundary file in the browser and returns { geometry, note }.
 * GeoJSON (.geojson/.json), KML, KMZ (zipped KML) and zipped shapefiles
 * (.zip with .shp, .dbf and ideally .prj; reprojected to WGS 84 when the
 * .prj says another system). Throws an Error with a plain message.
 */
export async function readGeoFile(file, shape = 'area') {
  if (file.size > MAX_BYTES) throw new Error('The file is larger than 20 MB.');
  const name = file.name.toLowerCase();
  let gj;
  if (name.endsWith('.geojson') || name.endsWith('.json')) {
    try { gj = JSON.parse(await file.text()); } catch { throw new Error('The file is not valid GeoJSON.'); }
  } else if (name.endsWith('.kml')) {
    gj = await kmlToGeoJson(await file.text());
  } else if (name.endsWith('.kmz')) {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => { throw new Error('The KMZ file could not be opened.'); });
    const entry = Object.values(zip.files).find((f) => !f.dir && f.name.toLowerCase().endsWith('.kml'));
    if (!entry) throw new Error('No KML file inside this KMZ.');
    gj = await kmlToGeoJson(await entry.async('text'));
  } else if (name.endsWith('.zip')) {
    const { default: shp } = await import('shpjs');
    try { gj = await shp(await file.arrayBuffer()); } catch { throw new Error('No shapefile found in this zip. It needs the .shp, .shx and .dbf files (and .prj if not in WGS 84).'); }
  } else if (name.endsWith('.shp')) {
    throw new Error('Put the .shp, .shx, .dbf and .prj files in one zip and upload the zip.');
  } else {
    throw new Error('Use GeoJSON, KML, KMZ or a zipped shapefile.');
  }
  const geometry = pickGeometry(gj, shape);
  const parts = geometry.type === 'MultiPolygon' ? geometry.coordinates.length : 1;
  const note = shape === 'area'
    ? `${parts} area${parts > 1 ? 's' : ''}, about ${geometryAreaHa(geometry).toFixed(2)} ha`
    : shape === 'line' ? `Line of about ${Math.round(lineLengthM(geometry))} m` : 'Point read';
  return { geometry, note };
}
