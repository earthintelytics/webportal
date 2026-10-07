import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { createFarm, uploadBoundary } from '../../../services/adminApi';
import { boundaryCheck } from '../../components/validation';
import { SENSOR_OPTIONS, toggleInList, inputCls } from '../../components/formHelpers';
import { Button, Field, Chip, Modal } from '../../components/ui';
import { ServicesPicker } from './BoundaryServices';

const INDICES = ['NDVI', 'EVI', 'NDMI', 'RECI', 'NDWI', 'LSWI'];

/**
 * Add another estate to an organisation that already exists: name, imagery,
 * indices, optional parent estate, boundary (checked before upload).
 */
const AddEstateForm = ({ org, farms, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [sensors, setSensors] = useState(['sentinel-2', 'sentinel-1']);
  const [indices, setIndices] = useState(['NDVI', 'NDMI']);
  const [parent, setParent] = useState('');
  const [services, setServices] = useState([]);
  const [file, setFile] = useState(null);
  const [fileNote, setFileNote] = useState('');
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const parents = [...new Set(farms.map((f) => f.parent_farm_id).filter(Boolean))];

  const pick = async (e) => {
    const f = e.target.files?.[0];
    setFile(null); setFileNote(''); setFileError('');
    if (!f) return;
    let parsed; try { parsed = JSON.parse(await f.text()); } catch { parsed = null; }
    const check = boundaryCheck(parsed, f.size);
    if (check.error) { setFileError(check.error); return; }
    setFile(f); setFileNote(`${check.polygons} polygon${check.polygons > 1 ? 's' : ''} read${check.warning ? `. ${check.warning}` : ''}`);
  };

  const save = async () => {
    setError(''); setProgress({ pct: 5, text: 'Creating the estate…' });
    try {
      const p = farms.find((f) => f.parent_farm_id === parent || f.farm_id === parent);
      const created = await createFarm({
        company_name: org.display_name, company_id: org.schema_name, farm_name: name.trim(), farm_id: '',
        parent_farm_id: parent || '', parent_farm_name: parent ? (p?.parent_farm_name || p?.farm_name || parent) : '',
        services, sensors, indices, processing_level: 'plot_level', cloud_cover_threshold: 10, start_date: null, end_date: null,
      });
      await uploadBoundary(created.farm_id, file, (prog) => setProgress({ pct: Math.max(20, Math.min(95, 20 + Math.round(prog.percent * 0.75))), text: `Uploading the boundary (${prog.percent}%)…` }));
      setProgress({ pct: 100, text: 'Estate added.' });
      onSaved();
    } catch (e) { setError(e.message); setProgress(null); }
  };

  const busy = Boolean(progress);
  return (
    <Modal title="Add an estate" text={org.display_name} onClose={busy ? undefined : onClose}
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={save} disabled={busy || !name.trim() || !file}>{busy ? `Adding (${progress.pct}%)…` : 'Add estate'}</Button></>}>
      {error && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <Field label="Estate name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} placeholder="e.g. North estate" /></Field>
      <ServicesPicker org={org} value={services} onChange={setServices} disabled={busy} />
      <Field label="Imagery"><div className="flex flex-wrap gap-2">{SENSOR_OPTIONS.map((s) => <Chip key={s} on={sensors.includes(s)} onClick={() => setSensors((l) => toggleInList(l, s))}>{s}</Chip>)}</div></Field>
      <Field label="Indices processed"><div className="flex flex-wrap gap-2">{INDICES.map((i) => <Chip key={i} on={indices.includes(i)} onClick={() => setIndices((l) => toggleInList(l, i))}>{i}</Chip>)}</div></Field>
      {parents.length > 0 && (
        <Field label="Part of" hint="Group this estate under an existing parent estate.">
          <select className={inputCls} value={parent} onChange={(e) => setParent(e.target.value)} disabled={busy}>
            <option value="">Its own estate</option>
            {parents.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      )}
      <Field label="Boundary (GeoJSON)" error={fileError} hint={fileNote || 'Polygons in longitude/latitude (WGS 84).'}>
        <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer ${file ? 'border-green-600 bg-green-50/40' : 'border-dashed border-gray-300 bg-white'}`}>
          <UploadCloud size={16} className={file ? 'text-green-700' : 'text-gray-400'} />
          <span className="text-sm text-gray-700 truncate">{file ? file.name : 'Choose a .geojson file'}</span>
          <input type="file" accept=".geojson,.json,application/geo+json" className="hidden" disabled={busy} onChange={pick} />
        </label>
      </Field>
      {progress && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600"><span>{progress.text}</span><span className="font-mono">{progress.pct}%</span></div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-green-600 transition-all" style={{ width: `${progress.pct}%` }} /></div>
        </div>
      )}
    </Modal>
  );
};

export default AddEstateForm;
