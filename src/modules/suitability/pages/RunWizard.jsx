import { useEffect, useState } from 'react';
import { submitSuitabilityRun } from '../suitabilityApi';
import { fetchFarms, fetchSuitabilityThresholds } from '../../../services/adminApi';
import { boundaryCheck } from '../../../farmintelytics-admin/components/validation';
import { Modal, Field, PrimaryButton, SecondaryButton, ErrorNote } from '../../../components/page/PageKit';
import { inputCls } from '../../../components/page/useLoader';
import { CROPS } from '../suitabilityLabels';

const STRICTNESS = [
  { id: 'estate', label: 'Commercial estate', text: 'Stricter: only the best land counts as well suited' },
  { id: 'standard', label: 'Standard', text: 'The default thresholds' },
  { id: 'smallholder', label: 'Smallholder', text: 'Marginal land can still be worth planting' },
];

/**
 * New analysis: area (a registered estate or an uploaded boundary that is
 * actually sent), crop, and the questions that change the result. Starts a
 * real run; progress comes from the run status, nothing is simulated.
 */
const RunWizard = ({ orgs, initialCrop, onClose, onStarted }) => {
  const [companyId, setCompanyId] = useState(orgs.length === 1 ? orgs[0].company_id : '');
  const [farms, setFarms] = useState([]);
  const [crop, setCrop] = useState(initialCrop || CROPS[0].id);
  const [variants, setVariants] = useState([]);
  const [form, setForm] = useState({ area: 'estate', farm_id: '', variant: '', irrigated: false, strictness: 'standard', use_soil_samples: true });
  const [geojson, setGeojson] = useState(null);
  const [fileNote, setFileNote] = useState('');
  const [fileError, setFileError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let live = true;
    if (!companyId) return undefined;
    fetchFarms(companyId).then((f) => { if (live) setFarms(Array.isArray(f) ? f : []); }).catch(() => {});
    return () => { live = false; };
  }, [companyId]);

  // Variants come from the admin's suitability settings for the crop.
  useEffect(() => {
    let live = true;
    const admin = CROPS.find((c) => c.id === crop)?.admin || crop;
    fetchSuitabilityThresholds(admin, companyId)
      .then((d) => { if (live) setVariants(Array.isArray(d?.variants) ? d.variants : []); })
      .catch(() => { if (live) setVariants([]); });
    return () => { live = false; };
  }, [crop, companyId]);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    setGeojson(null); setFileNote(''); setFileError('');
    if (!f) return;
    let parsed; try { parsed = JSON.parse(await f.text()); } catch { parsed = null; }
    const check = boundaryCheck(parsed, f.size);
    if (check.error) { setFileError(check.error); return; }
    setGeojson(parsed); setFileNote(`${check.polygons} polygon${check.polygons > 1 ? 's' : ''} read.`);
  };

  const areaReady = Boolean(companyId) && (form.area === 'estate' ? true : Boolean(geojson));
  const start = async () => {
    setBusy(true); setError('');
    try {
      const run = await submitSuitabilityRun({
        crop, company_id: companyId,
        farm_id: form.area === 'estate' ? form.farm_id || null : null,
        area: form.area === 'upload' ? { geojson } : null,
        variant: form.variant || null, irrigated: form.irrigated, strictness: form.strictness, use_soil_samples: form.use_soil_samples,
      });
      onStarted(run, companyId);
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Modal wide title="New analysis" onClose={onClose}
      footer={<><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton onClick={start} disabled={busy || !areaReady}>{busy ? 'Starting…' : 'Start the analysis'}</PrimaryButton></>}>
      {error && <ErrorNote message={error} />}
      <Field label="Organisation">
        <select className={inputCls} value={companyId} onChange={(e) => { setCompanyId(e.target.value); setFarms([]); set('farm_id', ''); }}>
          <option value="" disabled>Select</option>
          {orgs.map((o) => <option key={o.company_id} value={o.company_id}>{o.company_name || o.company_id}</option>)}
        </select>
      </Field>
      <p className="text-sm text-gray-600">Rainfall, temperature, terrain, soil, flooding, forest in 2020 and protected areas are fetched by the pipeline.</p>

      <Field label="Crop">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CROPS.map((c) => (
            <button key={c.id} type="button" onClick={() => { setCrop(c.id); set('variant', ''); }} className={`px-3 py-2 rounded-xl border text-sm ${crop === c.id ? 'border-green-600 bg-green-50 text-green-900 font-semibold' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}>{c.name}</button>
          ))}
        </div>
      </Field>

      <Field label="Where">
        <div className="flex gap-2 mb-3">
          {[['estate', 'A registered estate'], ['upload', 'Upload an area']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => set('area', id)} className={`px-3 py-2 rounded-xl border text-sm ${form.area === id ? 'border-green-600 bg-green-50 text-green-900 font-semibold' : 'border-gray-300 bg-white text-gray-700'}`}>{label}</button>
          ))}
        </div>
        {form.area === 'estate' ? (
          <select className={inputCls} value={form.farm_id} onChange={(e) => set('farm_id', e.target.value)}>
            <option value="">All estates of the organisation</option>
            {farms.map((f) => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
          </select>
        ) : (
          <>
            <input type="file" accept=".geojson,.json,application/geo+json" onChange={pick} className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-sm" />
            <p className={`text-xs mt-1 ${fileError ? 'text-red-700' : 'text-gray-500'}`}>{fileError || fileNote || 'GeoJSON polygons in longitude/latitude, e.g. a planned expansion area.'}</p>
          </>
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Variety or system" hint={variants.length ? null : 'No variants set for this crop in the admin.'}>
          <select className={inputCls} value={form.variant} onChange={(e) => set('variant', e.target.value)} disabled={!variants.length}>
            <option value="">Standard</option>
            {variants.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
        <div className="space-y-2 pt-7">
          <label className="flex items-center gap-2 text-sm text-gray-800"><input type="checkbox" checked={form.irrigated} onChange={(e) => set('irrigated', e.target.checked)} />Irrigated (rainfall limits are relaxed)</label>
          <label className="flex items-center gap-2 text-sm text-gray-800"><input type="checkbox" checked={form.use_soil_samples} onChange={(e) => set('use_soil_samples', e.target.checked)} />Use the organisation's soil samples</label>
        </div>
      </div>

      <Field label="How strict">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STRICTNESS.map((s) => (
            <button key={s.id} type="button" onClick={() => set('strictness', s.id)} className={`text-left px-3 py-2.5 rounded-xl border ${form.strictness === s.id ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
              <span className="block text-sm font-semibold text-gray-900">{s.label}</span>
              <span className="block text-xs text-gray-500">{s.text}</span>
            </button>
          ))}
        </div>
      </Field>
    </Modal>
  );
};

export default RunWizard;
