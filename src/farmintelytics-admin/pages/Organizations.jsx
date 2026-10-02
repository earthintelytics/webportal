import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Building2, 
  MapPin, 
  Search, 
  Layers, 
  ImagePlus, 
  Link2, 
  Copy, 
  ShieldCheck, 
  ChevronRight
} from 'lucide-react';
import {
  fetchOrganizations, updateOrganization, deleteOrganization, uploadOrganizationLogo,
  fetchFarms, getBoundaryProperties,
} from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { SERVICE_GROUPS } from '../../constants/servicePhotos';
import OrgDetailPanel from './OrganizationFarms';
import { ALL_CROPS } from '../components/formHelpers';

export const CROP_LABELS = {
  ffb: 'Oil Palm (FFB)',
  sugarcane: 'Sugarcane',
  rice: 'Rice',
  cocoa: 'Cocoa',
  cassava: 'Cassava',
  maize: 'Maize',
  rubber: 'Rubber',
  cashew: 'Cashew',
};

export const ALL_RS_INDICES = [
  { id: 'ndvi',   label: 'NDVI · Vegetation Health' },
  { id: 'evi',    label: 'EVI · Enhanced Vegetation' },
  { id: 'reci',   label: 'RECI · Chlorophyll / Nitrogen' },
  { id: 'ndmi',   label: 'NDMI · Canopy Moisture' },
  { id: 'lswi',   label: 'LSWI · Surface Water' },
  { id: 'ndwi',   label: 'NDWI · Water / Flood' },
  { id: 'wdi',    label: 'WDI · Water Deficit' },
  { id: 'ndre',   label: 'NDRE · Red-Edge Nitrogen' },
  { id: 'cvi',    label: 'CVI · Chlorophyll Vegetation' },
  { id: 'savi',   label: 'SAVI · Soil-Adjusted Veg.' },
  { id: 'rvi',    label: 'RVI · SAR Biomass' },
  { id: 'dprvi',  label: 'DpRVI · SAR Structure' },
  { id: 'smi',    label: 'SMI · SAR Soil Moisture' },
  { id: 'lai',    label: 'LAI · Leaf Area (derived)' },
  { id: 'gndvi',  label: 'GNDVI · Green NDVI (derived)' },
  { id: 'msi',    label: 'MSI · Moisture Stress (derived)' },
  { id: 'msavi2', label: 'MSAVI2 · Mod. Soil Adj. (derived)' },
];

const DEFAULT_ALERT_THRESHOLDS = {
  alert_ndvi_drop_pct: 0.25,
  alert_smi_critical: 0.2,
  alert_ndmi_water_stress_critical: 0.0,
  alert_ndvi_health_critical: 0.35,
};

export const slugify = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export const modulesForAccessModel = (model, crops, slug) => {
  const orgModules = slug ? [`custom-agromonitor-${slug}`] : [];
  const cropModules = (crops || []).flatMap(c => [`rs-${c}`, `management-${c}`]);
  if (model === 'organization') return orgModules;
  if (model === 'crop') return cropModules;
  return [...orgModules, ...cropModules];
};

export const ACCESS_MODELS = [
  { id: 'organization', label: 'Organization View', desc: 'One company-wide satellite dashboard (like Okomu / Olam)' },
  { id: 'crop', label: 'Crop Monitoring', desc: 'Per-crop monitoring + management portals for each allowed crop' },
];

const OrgModal = ({ org, onSave, onClose }) => {
  const [form, setForm] = useState(org ? {
    company_name: org.display_name, schema_name: org.schema_name,
    allowed_crops: org.allowed_crops || [],
    allowed_modules: org.allowed_modules || [],
    allowed_indices: org.allowed_indices || [],
    map_center_lat: org.map_center_lat, map_center_lon: org.map_center_lon,
    dashboard_filter_keys: org.dashboard_filter_keys || [],
    alert_ndvi_drop_pct: org.alert_ndvi_drop_pct ?? DEFAULT_ALERT_THRESHOLDS.alert_ndvi_drop_pct,
    alert_smi_critical: org.alert_smi_critical ?? DEFAULT_ALERT_THRESHOLDS.alert_smi_critical,
    alert_ndmi_water_stress_critical: org.alert_ndmi_water_stress_critical ?? DEFAULT_ALERT_THRESHOLDS.alert_ndmi_water_stress_critical,
    alert_ndvi_health_critical: org.alert_ndvi_health_critical ?? DEFAULT_ALERT_THRESHOLDS.alert_ndvi_health_critical,
    enable_timeseries_ffill: org.enable_timeseries_ffill || false,
  } : {});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(org?.logo_url || '');
  const fileInputRef = useRef(null);

  const toggleCrop = (c) => setForm(f => {
    const crops = f.allowed_crops.includes(c) ? f.allowed_crops.filter(x => x !== c) : [...f.allowed_crops, c];
    return { ...f, allowed_crops: crops };
  });

  const toggleModule = (m) => setForm(f => ({
    ...f,
    allowed_modules: f.allowed_modules.includes(m) ? f.allowed_modules.filter(x => x !== m) : [...f.allowed_modules, m],
  }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (logoFile && org?.id) {
        await uploadOrganizationLogo(org.id, logoFile);
      }
      await onSave(org?.id, form);
    } catch (err) {
      setFormError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 lg:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">Edit Organization</h3>
            <p className="text-xs text-slate-500 mt-0.5">Update licensed crops, services, and alert calibration</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 mt-6">
          {/* Logo & Company Name */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Building2 size={26} className="text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-white rounded-2xl transition-all"
              >
                Upload
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Display Name</label>
              <input
                type="text"
                value={form.company_name || ''}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Allowed Crops */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Licensed Crops</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CROPS.map(c => {
                const active = (form.allowed_crops || []).includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCrop(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      active
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allowed Service Modules */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Licensed Services & Suites</label>
            <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              {SERVICE_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.services.map(svc => {
                      const active = (form.allowed_modules || []).includes(svc.id);
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => toggleModule(svc.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            active
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {svc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {formError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {formError}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.company_name?.trim()}
            className="flex-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const Organizations = () => {
  const confirm = useConfirm();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [detailOrg, setDetailOrg] = useState(null);
  const [copiedSchema, setCopiedSchema] = useState(null);

  const load = async () => {
    try {
      const data = await fetchOrganizations();
      setOrgs(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (id, form) => {
    try {
      if (id) await updateOrganization(id, form);
      setModal(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Are you sure you want to delete this organization and all associated data?'))) return;
    try { await deleteOrganization(id); await load(); }
    catch (e) { setError(e.message); }
  };

  const copyDirectLink = (schema) => {
    const url = `${window.location.origin}/login?tenant=${schema}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).catch(() => fallbackCopyText(url));
    } else {
      fallbackCopyText(url);
    }
    setCopiedSchema(schema);
    setTimeout(() => setCopiedSchema(null), 2000);
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
    document.body.removeChild(textArea);
  };

  const filtered = orgs.filter(o =>
    o.display_name.toLowerCase().includes(search.toLowerCase()) ||
    o.schema_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto bg-white text-slate-900 font-sans min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>Multi-Tenant Administration</span>
          </div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Registered Organizations
          </h2>
          <p className="text-xs lg:text-sm text-slate-600 mt-1">
            Manage tenant portfolios, licensed crop portals, active sustainability suites, and estate boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="text-emerald-700 font-bold">{orgs.length}</span> Active Tenants
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search organizations by name or slug…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {/* Organizations Grid (Clean Pure White Cards, No Lift) */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">
          <div className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
          Loading organizations…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 text-slate-500 text-sm">
              No matching organizations found.
            </div>
          )}

          {filtered.map(org => {
            const cropCount = org.allowed_crops?.length || 0;
            const moduleCount = org.allowed_modules?.length || 0;

            return (
              <div
                key={org.id}
                onClick={() => setDetailOrg(org)}
                className="group relative flex flex-col bg-white border border-slate-200 hover:border-slate-400 rounded-3xl p-6 transition-colors shadow-xs cursor-pointer"
              >
                {/* Top Row: Logo, Title, Actions */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center overflow-hidden p-1">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="" className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <Building2 size={22} className="text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {org.display_name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {org.schema_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setModal({ org })}
                      title="Edit organization"
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(org.id)}
                      title="Delete organization"
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Direct Tenant Link Badge with Copy */}
                <div 
                  className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Link2 size={13} className="text-emerald-700 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-600 truncate">
                      /login?tenant={org.schema_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyDirectLink(org.schema_name);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                      copiedSchema === org.schema_name
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {copiedSchema === org.schema_name ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedSchema === org.schema_name ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Location & Summary Stats */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {org.map_center_lat?.toFixed(3)}, {org.map_center_lon?.toFixed(3)}
                  </span>
                  <span>&middot;</span>
                  <span>{moduleCount} Services</span>
                  <span>&middot;</span>
                  <span>{cropCount} Crops</span>
                </div>

                {/* Crop Chips */}
                <div className="flex flex-wrap gap-1.5 mb-5 flex-1">
                  {(org.allowed_crops || []).slice(0, 4).map(c => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {CROP_LABELS[c] || c}
                    </span>
                  ))}
                  {(org.allowed_crops || []).length > 4 && (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600">
                      +{org.allowed_crops.length - 4} more
                    </span>
                  )}
                  {(!org.allowed_crops || org.allowed_crops.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No crops configured</span>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} />
                    Explore Farms & Boundaries
                  </span>
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <OrgModal org={modal.org} onSave={handleSave} onClose={() => setModal(null)} />}
      {detailOrg && <OrgDetailPanel org={detailOrg} onClose={() => setDetailOrg(null)} />}
    </div>
  );
};

export default Organizations;
