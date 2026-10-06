import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Trash2, Building2, Search, Copy, Check, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchOrganizations, updateOrganization, deleteOrganization, uploadOrganizationLogo } from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { SERVICE_GROUPS } from '../../constants/servicePhotos';
import { ALL_CROPS, inputCls, toggleInList } from '../components/formHelpers';
import { CROP_LABELS } from '../components/orgConstants';
import { Page, Card, Button, IconButton, Field, Chip, Pill, Modal, Empty, Loading } from '../components/ui';
import OrgDetailPanel from './OrganizationFarms';

/** Client organisations: what each is licensed for, its sign-in link, and its estates. */
const Organizations = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = async () => {
    try { const data = await fetchOrganizations(); setOrgs(Array.isArray(data) ? data : data?.items || []); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const remove = async (org) => {
    if (!(await confirm(`Delete ${org.display_name} and everything stored for it? This cannot be undone.`))) return;
    try { await deleteOrganization(org.id); await load(); } catch (e) { setError(e.message); }
  };
  const copyLink = async (schema) => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/org/${schema}/login`); setCopied(schema); setTimeout(() => setCopied(null), 2000); } catch { setError('Copy failed: select the link and copy it.'); }
  };

  const shown = useMemo(() => {
    const q = search.toLowerCase();
    return orgs.filter((o) => !q || `${o.display_name} ${o.schema_name}`.toLowerCase().includes(q));
  }, [orgs, search]);

  return (
    <Page
      wide
      eyebrow="Clients"
      title="Organisations"
      text="Every client organisation: the crops and services it is licensed for, its own sign-in link, and its estates and boundaries."
      actions={<Button onClick={() => navigate('/admin/onboarding')}><Plus size={16} />Onboard an organisation</Button>}
    >
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputCls} pl-10`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or id" />
        </label>
        <span className="ml-auto text-sm text-gray-500">{orgs.length} organisation{orgs.length === 1 ? '' : 's'}</span>
      </div>

      {loading ? <Loading>Loading organisations…</Loading> : shown.length === 0 ? (
        <Empty>{orgs.length ? 'No organisation matches.' : 'No organisations yet. Start with “Onboard an organisation”.'}</Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {shown.map((org) => {
            const crops = org.allowed_crops || [];
            const services = (org.allowed_modules || []).filter((m) => !m.startsWith('rs-'));
            return (
              <Card key={org.id} className="flex flex-col hover:border-gray-300 transition-colors">
                <button type="button" onClick={() => setDetail(org)} className="text-left p-6 flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-contain p-1" /> : <Building2 size={20} className="text-gray-400" />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-gray-900 truncate">{org.display_name}</h3>
                      <p className="text-xs font-mono text-gray-500">{org.schema_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {crops.slice(0, 4).map((c) => <Pill key={c} tone="good">{CROP_LABELS[c] || c}</Pill>)}
                    {crops.length > 4 && <Pill>+{crops.length - 4}</Pill>}
                    {services.length > 0 && <Pill tone="info">{services.length} service{services.length === 1 ? '' : 's'}</Pill>}
                    {!crops.length && !services.length && <span className="text-xs text-gray-500">Nothing licensed yet</span>}
                  </div>
                </button>
                <div className="px-6 pb-3 flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg">/org/{org.schema_name}/login</code>
                  <IconButton label="Copy sign-in link" onClick={() => copyLink(org.schema_name)}>{copied === org.schema_name ? <Check size={15} /> : <Copy size={15} />}</IconButton>
                </div>
                <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-gray-100">
                  <button type="button" onClick={() => setDetail(org)} className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800">Estates and boundaries<ChevronRight size={15} /></button>
                  <div className="flex gap-1">
                    <IconButton label="Edit" onClick={() => setEditing(org)}><Pencil size={15} /></IconButton>
                    <IconButton label="Delete" danger onClick={() => remove(org)}><Trash2 size={15} /></IconButton>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && <OrgModal org={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />}
      {detail && <OrgDetailPanel org={detail} onClose={() => setDetail(null)} />}
    </Page>
  );
};

function OrgModal({ org, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: org.display_name, schema_name: org.schema_name,
    allowed_crops: org.allowed_crops || [], allowed_modules: org.allowed_modules || [],
    allowed_indices: org.allowed_indices || [], map_center_lat: org.map_center_lat, map_center_lon: org.map_center_lon,
    dashboard_filter_keys: org.dashboard_filter_keys || [], enable_timeseries_ffill: org.enable_timeseries_ffill || false,
  });
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(org.logo_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const toggleCrop = (c) => setForm((f) => {
    const crops = toggleInList(f.allowed_crops, c);
    // A crop portal is licensed with its crop.
    const modules = crops.includes(c) ? [...new Set([...f.allowed_modules, `rs-${c}`])] : f.allowed_modules.filter((m) => m !== `rs-${c}`);
    return { ...f, allowed_crops: crops, allowed_modules: modules };
  });
  const toggleModule = (m) => setForm((f) => ({ ...f, allowed_modules: toggleInList(f.allowed_modules, m) }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (logo) await uploadOrganizationLogo(org.id, logo);
      await updateOrganization(org.id, form);
      onSaved();
    } catch (e) { setError(e.message || 'Could not save'); setSaving(false); }
  };

  return (
    <Modal size="lg" title={`Edit ${org.display_name}`} text="Name, logo, and what the organisation is licensed for." onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving || !form.company_name?.trim()}>{saving ? 'Saving…' : 'Save changes'}</Button></>}>
      {error && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <div className="flex items-end gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} className="w-16 h-16 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0" aria-label="Change logo">
          {preview ? <img src={preview} alt="" className="w-full h-full object-contain p-1" /> : <Building2 size={22} className="text-gray-400" />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogo(f); setPreview(URL.createObjectURL(f)); } }} />
        <Field label="Name" className="flex-1"><input className={inputCls} value={form.company_name || ''} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} /></Field>
      </div>
      <Field label="Crops" hint="Each licensed crop gets its monitoring portal.">
        <div className="flex flex-wrap gap-2">{ALL_CROPS.map((c) => <Chip key={c} on={form.allowed_crops.includes(c)} onClick={() => toggleCrop(c)}>{CROP_LABELS[c] || c}</Chip>)}</div>
      </Field>
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-800">Services</p>
        {SERVICE_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="text-xs font-medium text-gray-500 mb-2">{g.label}</p>
            <div className="flex flex-wrap gap-2">{g.services.map((s) => <Chip key={s.id} on={form.allowed_modules.includes(s.id)} onClick={() => toggleModule(s.id)} title={s.desc}>{s.label}</Chip>)}</div>
          </div>
        ))}
        <p className="text-xs text-gray-500">Crop suitability is a FarmIntelytics team tool and is not licensed to organisations.</p>
      </div>
    </Modal>
  );
}

export default Organizations;
