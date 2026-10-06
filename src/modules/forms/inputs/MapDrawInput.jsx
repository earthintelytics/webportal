import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Trash2, Undo2, Upload } from 'lucide-react';
import { geometryAreaHa, geometryFromVertices, lineLengthM, readGeoFile } from '../geo';

const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const GREEN = '#3F8432';
const pin = L.divIcon({ className: '', html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${GREEN};border:3px solid #fff"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
const btn = 'inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-800 active:bg-gray-100 disabled:opacity-50';

const SHAPE_TEXT = {
  point: 'Tap the map where it is, or use your location.',
  line: 'Tap the map along the line, point by point.',
  area: 'Tap each corner of the area in order. You can also upload a boundary file.',
};

function Taps({ onTap }) {
  useMapEvents({ click: (e) => onTap({ lat: e.latlng.lat, lon: e.latlng.lng }) });
  return null;
}

function FitTo({ geometry, center }) {
  const map = useMap();
  useEffect(() => {
    if (geometry) {
      const layer = L.geoJSON(geometry);
      const b = layer.getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [24, 24], maxZoom: 18 });
    } else if (center) map.setView([center.lat, center.lon], 17);
  }, [geometry, center, map]);
  return null;
}

const ringsToLatLng = (g) => (g.type === 'Polygon' ? [g.coordinates.map((r) => r.map(([lon, lat]) => [lat, lon]))]
  : g.type === 'MultiPolygon' ? g.coordinates.map((p) => p.map((r) => r.map(([lon, lat]) => [lat, lon]))) : []);

/**
 * Draw a point, line or area on a satellite map, or fill it from a file
 * (GeoJSON, KML, KMZ, zipped shapefile). Value: a GeoJSON geometry in
 * longitude/latitude plus `source` ("drawn" | "file" | "gps") and, for a
 * file, `file_name`. Works with a finger on a phone.
 */
const MapDrawInput = ({ shape = 'area', value, onChange, allowUpload = true }) => {
  // A drawn answer restored from a draft keeps its corners editable.
  const [vertices, setVertices] = useState(() => {
    if (value?.source !== 'drawn' || !value.coordinates) return [];
    const c = value.type === 'Polygon' ? value.coordinates[0].slice(0, -1) : value.type === 'LineString' ? value.coordinates : [value.coordinates];
    return c.map(([lon, lat]) => ({ lat, lon }));
  });
  const [center, setCenter] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const fromFile = value?.source === 'file';

  const commit = (pts) => {
    setVertices(pts);
    const g = geometryFromVertices(shape, pts);
    onChange(g ? { ...g, source: 'drawn' } : null);
  };
  const tap = (p) => { if (fromFile) return; setError(''); commit(shape === 'point' ? [p] : [...vertices, p]); };

  const locate = () => {
    setError('');
    if (!navigator.geolocation) { setError('This device cannot share its location.'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setBusy(false); setCenter(p);
        if (shape === 'point') { setVertices([p]); onChange({ type: 'Point', coordinates: [p.lon, p.lat], source: 'gps', accuracy_m: Math.round(pos.coords.accuracy) }); }
      },
      (e) => { setBusy(false); setError(e.code === 1 ? 'Allow location access to use this.' : 'Location not found. Move outside and try again.'); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setError(''); setNote('');
    try {
      const { geometry, note: n } = await readGeoFile(file, shape);
      setVertices([]); setNote(`${file.name}: ${n}`);
      onChange({ ...geometry, source: 'file', file_name: file.name });
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const clear = () => { setVertices([]); setNote(''); setError(''); onChange(null); };

  const geometry = value && value.type ? value : null;
  const summary = useMemo(() => {
    if (!geometry) return shape === 'area' && vertices.length ? `${vertices.length} corner${vertices.length > 1 ? 's' : ''}, at least 3 needed` : shape === 'line' && vertices.length === 1 ? '1 point, at least 2 needed' : '';
    if (geometry.type === 'Point') return `${geometry.coordinates[1].toFixed(6)}, ${geometry.coordinates[0].toFixed(6)}${geometry.accuracy_m ? ` (± ${geometry.accuracy_m} m)` : ''}`;
    if (geometry.type === 'LineString') return `${geometry.coordinates.length} points · about ${Math.round(lineLengthM(geometry))} m`;
    return `About ${geometryAreaHa(geometry).toFixed(2)} ha`;
  }, [geometry, vertices, shape]);

  const start = useMemo(() => (geometry ? null : center), [geometry, center]);
  const linePts = vertices.map((p) => [p.lat, p.lon]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600">{fromFile ? 'From your file. Clear it to draw instead.' : SHAPE_TEXT[shape]}</p>
      <div className="h-72 rounded-xl overflow-hidden border border-gray-300 relative z-0">
        <MapContainer center={[7.5, 4.5]} zoom={6} maxZoom={19} style={{ height: '100%', width: '100%' }} attributionControl={false}>
          <TileLayer url={IMAGERY} maxZoom={19} />
          <TileLayer url={LABELS} maxZoom={19} />
          <Taps onTap={tap} />
          <FitTo geometry={fromFile ? geometry : null} center={start} />
          {geometry?.type === 'Point' && <Marker position={[geometry.coordinates[1], geometry.coordinates[0]]} icon={pin} />}
          {geometry?.type === 'LineString' && <Polyline positions={geometry.coordinates.map(([lon, lat]) => [lat, lon])} pathOptions={{ color: GREEN, weight: 4 }} />}
          {(geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon') && ringsToLatLng(geometry).map((p, i) => <Polygon key={i} positions={p} pathOptions={{ color: GREEN, weight: 3, fillOpacity: 0.2 }} />)}
          {!geometry && shape !== 'point' && linePts.length > 1 && <Polyline positions={linePts} pathOptions={{ color: GREEN, weight: 3, dashArray: '6 6' }} />}
          {!fromFile && shape !== 'point' && linePts.map((p, i) => <CircleMarker key={i} center={p} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: GREEN, fillOpacity: 1 }} />)}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={locate} disabled={busy} className={btn}><Crosshair size={16} />{shape === 'point' ? 'Use my location' : 'Go to my location'}</button>
        {!fromFile && shape !== 'point' && vertices.length > 0 && <button type="button" onClick={() => commit(vertices.slice(0, -1))} className={btn}><Undo2 size={16} />Undo</button>}
        {allowUpload && (
          <label className={`${btn} cursor-pointer`}>
            <Upload size={16} />{busy ? 'Reading…' : 'Upload a file'}
            <input type="file" accept=".geojson,.json,.kml,.kmz,.zip" onChange={upload} className="hidden" />
          </label>
        )}
        {(geometry || vertices.length > 0) && <button type="button" onClick={clear} className={btn}><Trash2 size={16} />Clear</button>}
      </div>
      {summary && <p className="text-xs font-medium text-gray-800">{summary}</p>}
      {note && <p className="text-xs text-gray-600">{note}</p>}
      {allowUpload && !geometry && <p className="text-xs text-gray-500">Files: GeoJSON, KML, KMZ, or a zipped shapefile (.shp, .shx, .dbf and .prj in one zip).</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

export default MapDrawInput;
