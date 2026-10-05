import { useState } from 'react';
import { MapPin, Plus, Undo2 } from 'lucide-react';
import { ringAreaHa } from '../geo';
import { boundaryCheck } from '../../../farmintelytics-admin/components/validation';

const readPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) { reject(new Error('This phone cannot share its location.')); return; }
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy_m: Math.round(p.coords.accuracy) }),
    (e) => reject(new Error(e.code === 1 ? 'Allow location access to record this.' : 'Location not found. Move outside and try again.')),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
  );
});

const btn = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-800 active:bg-gray-100 disabled:opacity-50';

export const GpsPointInput = ({ value, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const record = async () => {
    setBusy(true); setError('');
    try { onChange(await readPosition()); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  return (
    <div className="space-y-2">
      <button type="button" onClick={record} disabled={busy} className={btn}><MapPin size={16} />{busy ? 'Finding location…' : value ? 'Record again' : 'Record my location'}</button>
      {value && <p className="text-xs text-gray-600 font-mono">{value.lat.toFixed(6)}, {value.lon.toFixed(6)} (± {value.accuracy_m} m)</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

/** Walk the field edge and add each corner; at least 3 corners make a boundary. */
export const BoundaryWalkInput = ({ value, onChange }) => {
  const points = Array.isArray(value) ? value : [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const add = async () => {
    setBusy(true); setError('');
    try { onChange([...points, await readPosition()]); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const area = ringAreaHa(points);
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600">Stand at each corner of the field, in order, and tap “Add corner”.</p>
      <div className="flex gap-2">
        <button type="button" onClick={add} disabled={busy} className={btn}><Plus size={16} />{busy ? 'Finding location…' : 'Add corner'}</button>
        {points.length > 0 && <button type="button" onClick={() => onChange(points.slice(0, -1))} className={btn}><Undo2 size={16} />Undo</button>}
      </div>
      <p className="text-xs text-gray-700">{points.length} corner{points.length === 1 ? '' : 's'}{points.length >= 3 ? ` · about ${area.toFixed(2)} ha` : ''}</p>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

const BROWSER_READABLE = /\.(geo)?json$/i;

/**
 * A boundary file. GeoJSON is checked here (polygons, longitude/latitude);
 * KML, KMZ and zipped shapefiles are sent as they are and checked after
 * sending. Value: { file, geojson?, note?, error? }.
 */
export const BoundaryFileInput = ({ value, onChange }) => {
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) { onChange(null); return; }
    if (!BROWSER_READABLE.test(file.name)) { onChange({ file, note: 'Read and checked after sending.' }); return; }
    try {
      const geojson = JSON.parse(await file.text());
      const check = boundaryCheck(geojson, file.size);
      onChange(check.error ? { file, error: check.error } : { file, geojson, note: `${check.polygons} polygon${check.polygons > 1 ? 's' : ''} read.` });
    } catch {
      onChange({ file, error: 'The file is not valid GeoJSON.' });
    }
  };
  return (
    <div className="space-y-2">
      <input type="file" accept=".geojson,.json,.kml,.kmz,.zip" onChange={pick} className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-sm" />
      {value?.file && <p className="text-xs text-gray-600">{value.file.name}{value.note ? ` · ${value.note}` : ''}</p>}
    </div>
  );
};
