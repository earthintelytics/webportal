import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X, Building2, UploadCloud, RefreshCw, Settings, Eye, Sprout } from 'lucide-react';
import { fetchFarms, deleteFarm, uploadBoundary } from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { boundaryCheck } from '../components/validation';
import { CROP_LABELS } from '../components/orgConstants';
import { Button, IconButton, Pill, Loading, Empty, Tabs } from '../components/ui';
import AddEstateForm from './organisation/AddEstateForm';
import EstateConfigModal from './organisation/EstateConfigModal';
import BoundaryModal from './organisation/BoundaryModal';
import EstateDetailsModal from './organisation/EstateDetailsModal';
import OrgPeople from './organisation/OrgPeople';
import OrgLicence from './organisation/OrgLicence';
import OrgPipeline from './organisation/OrgPipeline';

/**
 * One organisation in one place: its estates, its people (roles and the
 * account limit of its licence), its licence, and its data pipeline.
 */
const OrgDetailPanel = ({ org: initialOrg, onClose }) => {
  const [org, setOrg] = useState(initialOrg);
  const [tab, setTab] = useState('estates');
  const confirm = useConfirm();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setFarms(await fetchFarms(org.schema_name)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [org.schema_name]); // eslint-disable-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps

  const remove = async (farm) => {
    if (!(await confirm(`Delete ${farm.farm_name} and everything stored for it?`))) return;
    try { await deleteFarm(farm.farm_id); await load(); } catch (e) { setError(e.message); }
  };
  const replaceBoundary = async (farmId, file) => {
    try { await uploadBoundary(farmId, file); await load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-900/30 flex justify-end" onClick={onClose}>
      <aside className="w-full max-w-2xl h-full bg-white border-l border-gray-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
          <span className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-contain p-1" /> : <Building2 size={18} className="text-gray-400" />}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-semibold text-gray-900 truncate">{org.display_name}</h2>
            <p className="text-xs font-mono text-gray-500">{org.schema_name}</p>
          </div>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="px-6 pt-4">
          <Tabs value={tab} onChange={setTab} tabs={[{ id: 'estates', label: 'Estates', count: farms.length }, { id: 'people', label: 'People' }, { id: 'licence', label: 'Licence' }, { id: 'pipeline', label: 'Pipeline' }]} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'people' && <OrgPeople org={org} />}
          {tab === 'licence' && <OrgLicence org={org} onSaved={setOrg} />}
          {tab === 'pipeline' && <OrgPipeline org={org} />}
          {tab === 'estates' && <>
          <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Estates and boundaries</p>
            <Button variant="secondary" className="!py-2" onClick={() => setAdding(true)}><Plus size={15} />Add an estate</Button>
          </div>
          {loading ? <Loading /> : farms.length === 0 ? <Empty>No estates yet. Add one with its boundary.</Empty> : (
            <ul className="space-y-2.5">{farms.map((f) => <EstateRow key={f.farm_id} farm={f} onDelete={remove} onReplace={replaceBoundary} />)}</ul>
          )}
          </>}
        </div>
      </aside>
      {adding && <AddEstateForm org={org} farms={farms} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </div>
  );
};

function EstateRow({ farm, onDelete, onReplace }) {
  const fileRef = useRef(null);
  const [info, setInfo] = useState(farm);
  const [open, setOpen] = useState(null); // config | boundary | details
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let parsed; try { parsed = JSON.parse(await file.text()); } catch { parsed = null; }
    const check = boundaryCheck(parsed, file.size);
    if (check.error) { setFileError(check.error); return; }
    setFileError(''); setUploading(true);
    try { await onReplace(farm.farm_id, file); } finally { setUploading(false); }
  };
  const details = [info.crop && (CROP_LABELS[info.crop] || info.crop), info.group_name, info.planting_date && `planted ${info.planting_date}`, info.is_irrigated && 'irrigated'].filter(Boolean).join(' · ');

  return (
    <li className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{farm.farm_name}</p>
          <p className="text-xs font-mono text-gray-500">{farm.farm_id}</p>
          <p className="text-xs text-gray-600 mt-1">{details || 'Estate details not set'}</p>
          {fileError && <p className="text-xs text-red-700 mt-1">{fileError}</p>}
        </div>
        <Pill tone={farm.boundary_uploaded ? 'good' : 'critical'}>{farm.boundary_uploaded ? 'Boundary' : 'No boundary'}</Pill>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {farm.boundary_uploaded && <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => setOpen('boundary')}><Eye size={14} />View boundary</button>}
        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => setOpen('details')}><Sprout size={14} />Crop and dates</button>
        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => setOpen('config')}><Settings size={14} />Pipeline settings</button>
        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}{farm.boundary_uploaded ? 'Replace boundary' : 'Upload boundary'}</button>
        <input ref={fileRef} type="file" accept=".geojson,.json,application/geo+json" className="hidden" onChange={pick} />
        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 !text-red-700 hover:!bg-red-50" onClick={() => onDelete(farm)}><Trash2 size={14} />Delete</button>
      </div>
      {open === 'config' && <EstateConfigModal farm={farm} onClose={() => setOpen(null)} />}
      {open === 'boundary' && <BoundaryModal farm={farm} onClose={() => setOpen(null)} />}
      {open === 'details' && <EstateDetailsModal farm={info} onClose={() => setOpen(null)} onSaved={(f) => { setInfo(f); setOpen(null); }} />}
    </li>
  );
}

export default OrgDetailPanel;
