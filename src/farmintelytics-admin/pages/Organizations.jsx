import { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, X, Check, Building2, MapPin, Search, Layers, ImagePlus, Link2, Copy } from 'lucide-react';
import {
  fetchOrganizations, createOrganization, updateOrganization, deleteOrganization, uploadOrganizationLogo,
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

const ALL_MODULES = [
  'rs-ffb', 'rs-maize', 'rs-rice', 'rs-cocoa', 'rs-sugarcane', 'rs-cashew', 'rs-rubber', 'rs-cassava', 'rs-drone',
  'management-ffb', 'management-maize', 'management-rice', 'management-cocoa', 'management-sugarcane', 'management-cashew', 'management-rubber', 'management-cassava',
  'group-management', 'group-monitoring', 'carbon-ffb', 'carbon-groups', 'forestry-intel', 'carbon-estimator', 'land-restoration', 'eudr-check', 'activity-ffb', 'advisor', 'finance-hub'
];

const MODULE_LABELS = {
  'rs-ffb': 'Oil Palm RS',
  'rs-maize': 'Maize RS',
  'rs-rice': 'Rice RS',
  'rs-cocoa': 'Cocoa RS',
  'rs-sugarcane': 'Sugarcane RS',
  'rs-cashew': 'Cashew RS',
  'rs-rubber': 'Rubber RS',
  'rs-cassava': 'Cassava RS',
  'rs-drone': 'Drone Inspection',
  'management-ffb': 'Oil Palm Mgmt',
  'management-maize': 'Maize Mgmt',
  'management-rice': 'Rice Mgmt',
  'management-cocoa': 'Cocoa Mgmt',
  'management-sugarcane': 'Sugarcane Mgmt',
  'management-cashew': 'Cashew Mgmt',
  'management-rubber': 'Rubber Mgmt',
  'management-cassava': 'Cassava Mgmt',
  'group-management': 'Groups Mgmt',
  'group-monitoring': 'Group Monitoring',
  'carbon-ffb': 'Estate Carbon',
  'carbon-groups': 'Group Carbon',
  'forestry-intel': 'Forestry Intel',
  'carbon-estimator': 'Carbon Est.',
  'land-restoration': 'Land Restoration',
  'eudr-check': 'EUDR Check',
  'activity-ffb': 'Field Logs',
  'advisor': 'Farm Advisor',
  'finance-hub': 'Finance Hub'
};

// Full remote-sensing product catalog. The first 13 are generated as rasters
// by the data pipeline; the last 4 are derived statistically in the backend.
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

const emptyForm = () => ({
  company_name: '', schema_name: '', allowed_crops: [], allowed_modules: [], allowed_indices: [], map_center_lat: 6.43, map_center_lon: 5.27,
});

const DEFAULT_ALERT_THRESHOLDS = {
  alert_ndvi_drop_pct: 0.25,
  alert_smi_critical: 0.2,
  alert_ndmi_water_stress_critical: 0.0,
  alert_ndvi_health_critical: 0.35,
};

// Mirrors the backend _slugify: lowercase, non-alphanumerics → underscores
export const slugify = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// Compose the module list for an access model.
// 'organization' → the company-wide agromonitor dashboard;
// 'crop' → per-crop monitoring + management portals; 'both' → union.
export const modulesForAccessModel = (model, crops, slug) => {
  const orgModules = slug ? [`custom-agromonitor-${slug}`] : [];
  const cropModules = (crops || []).flatMap(c => [`rs-${c}`, `management-${c}`]);
  if (model === 'organization') return orgModules;
  if (model === 'crop') return cropModules;
  return [...orgModules, ...cropModules];
};

// Deliberately no "Both" option — a company that wants an org-wide dashboard
// AND per-crop portals is onboarded twice (two organizations), so each is
// its own tenant with its own data instead of one record trying to be both.
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
  } : emptyForm());
  const [saving, setSaving] = useState(false);

  // Boundary-file property keys available to pick as dashboard filters —
  // same source the onboarding wizard reads from, just fetched here for an
  // org that's already been set up instead of one being created right now.
  const [filterOptions, setFilterOptions] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  useEffect(() => {
    if (!org?.schema_name) return;
    setLoadingFilters(true);
    (async () => {
      try {
        const farms = await fetchFarms(org.schema_name);
        const results = await Promise.all(farms.map(f => getBoundaryProperties(f.farm_id).catch(() => ({ properties: [] }))));
        const byKey = new Map();
        for (const r of results) {
          for (const p of (r.properties || [])) {
            if (!byKey.has(p.key)) byKey.set(p.key, p);
          }
        }
        setFilterOptions([...byKey.values()]);
      } catch {
        setFilterOptions([]);
      } finally {
        setLoadingFilters(false);
      }
    })();
  }, [org?.schema_name]);
  // Infer the starting model from existing data when editing (crops present
  // → 'crop') so the Allowed Crops section isn't hidden out from under an
  // org that already has crops configured. null = manual module selection.
  const [accessModel, setAccessModel] = useState(() => {
    if (!org) return null;
    return (org.allowed_crops && org.allowed_crops.length > 0) ? 'crop' : 'organization';
  });

  const effectiveSlug = () => form.schema_name.trim() || slugify(form.company_name);

  const applyAccessModel = (model, crops = form.allowed_crops) => {
    setAccessModel(model);
    setForm(f => ({ ...f, allowed_modules: modulesForAccessModel(model, crops, effectiveSlug()) }));
  };

  const toggleCrop = (c) => setForm(f => {
    const crops = f.allowed_crops.includes(c) ? f.allowed_crops.filter(x => x !== c) : [...f.allowed_crops, c];
    // Keep the module list in sync with the chosen access model
    const modules = accessModel ? modulesForAccessModel(accessModel, crops, effectiveSlug()) : f.allowed_modules;
    return { ...f, allowed_crops: crops, allowed_modules: modules };
  });

  const toggleModule = (m) => {
    setAccessModel(null); // manual tweak — stop auto-managing the list
    setForm(f => ({
      ...f, allowed_modules: f.allowed_modules.includes(m) ? f.allowed_modules.filter(x => x !== m) : [...f.allowed_modules, m],
    }));
  };

  const toggleIndex = (i) => setForm(f => ({
    ...f, allowed_indices: f.allowed_indices.includes(i) ? f.allowed_indices.filter(x => x !== i) : [...f.allowed_indices, i],
  }));

  const handleSave = async () => {
    if (!form.company_name.trim()) return;
    setSaving(true);
    try { await onSave(org?.id, form); }
    finally { setSaving(false); }
  };

  const [logoUrl, setLogoUrl] = useState(org?.logo_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef(null);

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;
    setUploadingLogo(true);
    setLogoError('');
    try {
      const updated = await uploadOrganizationLogo(org.id, file);
      setLogoUrl(updated.logo_url || '');
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: '#ffffff', border: '1px solid #cbd5e1',
    borderRadius: '10px', color: '#0f172a', fontSize: '13px', fontWeight: 500,
    outline: 'none', boxSizing: 'border-box', fontFamily: "var(--font-sans)",
  };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', letterSpacing: '0', marginBottom: '6px' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 50px rgba(15,23,42,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ color: '#0f172a', fontSize: '16px', fontWeight: 600, margin: 0 }}>{org ? 'Edit Organization' : 'New Organization'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Company Name *</label>
            <input style={inputStyle} placeholder="Company display name" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Branding logo</label>
            {org ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImagePlus size={18} color="#94a3b8" />}
                </div>
                <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} style={{ padding: '8px 14px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
                  {uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
                </button>
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={handleLogoFile} />
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>Save the organization first, then reopen it here to add a logo.</p>
            )}
            {logoError && <p style={{ color: '#dc2626', fontSize: '11px', margin: '4px 0 0' }}>{logoError}</p>}
          </div>
          <div>
            <label style={labelStyle}>Schema / Slug ID</label>
            <input style={inputStyle} placeholder="Auto-generated if blank" value={form.schema_name} onChange={e => setForm(f => ({ ...f, schema_name: e.target.value }))} />
            <p style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>Unique identifier used by the pipeline. Leave blank to auto-generate.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Map center lat</label>
              <input type="number" step="any" style={inputStyle} value={form.map_center_lat} onChange={e => setForm(f => ({ ...f, map_center_lat: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Map center lon</label>
              <input type="number" step="any" style={inputStyle} value={form.map_center_lon} onChange={e => setForm(f => ({ ...f, map_center_lon: parseFloat(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Access model</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ACCESS_MODELS.map(m => {
                const active = accessModel === m.id;
                return (
                  <button key={m.id} onClick={() => applyAccessModel(m.id)} title={m.desc} style={{
                    padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                    background: active ? 'rgba(22,163,74,0.1)' : '#ffffff',
                    border: active ? '1px solid rgba(22,163,74,0.4)' : '1px solid #cbd5e1',
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: active ? '#15803d' : '#334155' }}>{m.label}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.35 }}>{m.desc}</span>
                  </button>
                );
              })}
            </div>
            <p style={{ color: '#64748b', fontSize: '11px', margin: '6px 0 0' }}>
              Want both an org-wide dashboard and per-crop portals? Onboard this company twice — one organization per access model — so each is managed separately.
            </p>
          </div>
          {accessModel === 'crop' && (
            <div>
              <label style={labelStyle}>Allowed crops</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ALL_CROPS.map(c => {
                  const active = form.allowed_crops.includes(c);
                  return (
                    <button key={c} onClick={() => toggleCrop(c)} style={{
                      padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                      background: active ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.04)',
                      border: active ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      color: active ? '#16a34a' : '#6b7280',
                      transition: 'all 0.15s',
                    }}>
                      {CROP_LABELS[c] || c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label style={labelStyle}>Allowed satellite indices</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              {ALL_RS_INDICES.map(ix => {
                const active = form.allowed_indices.includes(ix.id);
                return (
                  <button key={ix.id} onClick={() => toggleIndex(ix.id)} style={{
                    padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                    background: active ? 'rgba(22,163,74,0.1)' : '#ffffff',
                    border: active ? '1px solid rgba(22,163,74,0.3)' : '1px solid #cbd5e1',
                    color: active ? '#16a34a' : '#475569',
                    transition: 'all 0.15s',
                  }}>
                    {ix.label}
                  </button>
                );
              })}
            </div>
            <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0' }}>
              Only the selected indices appear on this organization's maps, dropdowns and legends. Leave all unselected to allow everything.
            </p>
          </div>
          {org && (
            <div>
              <label style={labelStyle}>Dashboard filters</label>
              {loadingFilters && <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>Reading boundary properties…</p>}
              {!loadingFilters && filterOptions.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>No named boundary columns found for this org's farm(s) yet.</p>
              )}
              {!loadingFilters && filterOptions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {filterOptions.map(opt => {
                    const active = form.dashboard_filter_keys.includes(opt.key);
                    const disabled = !active && form.dashboard_filter_keys.length >= 4;
                    return (
                      <button
                        key={opt.key}
                        disabled={disabled}
                        title={opt.sample_values?.length ? `e.g. ${opt.sample_values.slice(0, 3).join(', ')}` : ''}
                        onClick={() => setForm(f => ({
                          ...f,
                          dashboard_filter_keys: active ? f.dashboard_filter_keys.filter(k => k !== opt.key) : [...f.dashboard_filter_keys, opt.key],
                        }))}
                        style={{
                          padding: '5px 10px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 700,
                          background: active ? 'rgba(22,163,74,0.1)' : '#ffffff',
                          border: active ? '1px solid rgba(22,163,74,0.3)' : '1px solid #cbd5e1',
                          color: active ? '#16a34a' : '#475569', opacity: disabled ? 0.4 : 1,
                        }}
                      >
                        {opt.key}
                      </button>
                    );
                  })}
                </div>
              )}
              <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0' }}>
                Up to 4 — {form.dashboard_filter_keys.length}/4 selected. None selected = no extra filter dropdowns on this org's dashboard.
              </p>
            </div>
          )}
          {org && (
            <div>
              <label style={labelStyle}>Alert thresholds</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px' }}>NDVI/SAVI/EVI Drop %</p>
                  <input type="number" step="0.01" min="0" max="1" style={inputStyle}
                    value={form.alert_ndvi_drop_pct}
                    onChange={e => setForm(f => ({ ...f, alert_ndvi_drop_pct: parseFloat(e.target.value || '0') }))} />
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px' }}>SMI Critical</p>
                  <input type="number" step="0.01" style={inputStyle}
                    value={form.alert_smi_critical}
                    onChange={e => setForm(f => ({ ...f, alert_smi_critical: parseFloat(e.target.value || '0') }))} />
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px' }}>NDMI Water Stress Critical</p>
                  <input type="number" step="0.01" style={inputStyle}
                    value={form.alert_ndmi_water_stress_critical}
                    onChange={e => setForm(f => ({ ...f, alert_ndmi_water_stress_critical: parseFloat(e.target.value || '0') }))} />
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px' }}>NDVI Health Critical</p>
                  <input type="number" step="0.01" style={inputStyle}
                    value={form.alert_ndvi_health_critical}
                    onChange={e => setForm(f => ({ ...f, alert_ndvi_health_critical: parseFloat(e.target.value || '0') }))} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginTop: '10px' }}>
                <input type="checkbox" checked={form.enable_timeseries_ffill}
                  onChange={e => setForm(f => ({ ...f, enable_timeseries_ffill: e.target.checked }))}
                  style={{ width: '15px', height: '15px', accentColor: '#16a34a', marginTop: '1px' }} />
                <span style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                  Forward-fill gaps in time-series charts (carry the last real reading forward instead of leaving a gap on dates with no clean scene).
                </span>
              </label>
            </div>
          )}
          <div>
            <label style={labelStyle}>What this organisation can open</label>
            {/* Grouped like the hub and onboarding; parked families (not in the current plan) are collapsed */}
            <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              {(() => {
                const all = [...new Set([...ALL_MODULES, ...form.allowed_modules])];
                const svcLabel = Object.fromEntries(SERVICE_GROUPS.flatMap(g => g.services.map(s => [s.id, s.label])));
                const cropName = (m) => ({ ffb: 'Oil palm', maize: 'Maize', rice: 'Rice', cocoa: 'Cocoa', sugarcane: 'Sugarcane', cashew: 'Cashew', rubber: 'Rubber', cassava: 'Cassava', drone: 'Drone' }[m.replace('rs-', '')] || m);
                const groups = [
                  { label: 'Organisation dashboard', items: all.filter(m => m.startsWith('custom-agromonitor-')), name: m => `Dashboard (${m.replace('custom-agromonitor-', '')})` },
                  { label: 'Crop monitoring', items: all.filter(m => m.startsWith('rs-')), name: cropName },
                  ...SERVICE_GROUPS.map(g => ({ label: g.label, items: g.services.map(s => s.id).filter(id => all.includes(id)), name: m => svcLabel[m] || m })),
                ];
                const grouped = new Set(groups.flatMap(g => g.items));
                const parked = all.filter(m => !grouped.has(m));
                const chip = (m, name) => {
                  const on = form.allowed_modules.includes(m);
                  return (
                    <button key={m} type="button" onClick={() => toggleModule(m)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${on ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                      {name(m)}
                    </button>
                  );
                };
                return (
                  <>
                    {groups.filter(g => g.items.length).map(g => (
                      <div key={g.label}>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1.5">{g.label}</div>
                        <div className="flex flex-wrap gap-1.5">{g.items.map(m => chip(m, g.name))}</div>
                      </div>
                    ))}
                    {parked.length > 0 && (
                      <details>
                        <summary className="text-[11px] font-semibold text-gray-500 cursor-pointer">Not in the current plan ({parked.length})</summary>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">{parked.map(m => chip(m, x => MODULE_LABELS[x] || x))}</div>
                      </details>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#334155', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.company_name.trim()} style={{
            flex: 2, padding: '12px', background: '#15803d', border: 'none', borderRadius: '12px',
            color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px', opacity: saving ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {saving ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Check size={15} />{org ? 'Update' : 'Create'}</>}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
      else await createOrganization(form);
      setModal(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this organization and all its data?'))) return;
    try { await deleteOrganization(id); await load(); }
    catch (e) { setError(e.message); }
  };

  const [copiedSchema, setCopiedSchema] = useState(null);

  const copyDirectLink = (schema) => {
    const url = `${window.location.origin}/login?tenant=${schema}`;
    navigator.clipboard.writeText(url);
    setCopiedSchema(schema);
    setTimeout(() => setCopiedSchema(null), 2000);
  };

  const filtered = orgs.filter(o =>
    o.display_name.toLowerCase().includes(search.toLowerCase()) ||
    o.schema_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 600, margin: 0 }}>Organizations</h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>{orgs.length} registered tenants</p>
        </div>
        <button onClick={() => setModal({ org: null })} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
          background: '#15803d', border: 'none', borderRadius: '10px',
          color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          boxShadow: 'none',
        }}>
          <Plus size={16} />New Organization
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input placeholder="Search organizations…" value={search} onChange={e => setSearch(e.target.value)} style={{
          width: '100%', padding: '10px 12px 10px 36px',
          background: '#ffffff', border: '1px solid #cbd5e1',
          borderRadius: '10px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
        }} />
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#475569' }}>
              No organizations found. Create one to get started.
            </div>
          )}
          {filtered.map(org => (
            <div key={org.id} onClick={() => setDetailOrg(org)} style={{
              background: '#ffffff', border: '1px solid #cbd5e1',
              borderRadius: '16px', padding: '20px', transition: 'all 0.15s', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {org.logo_url ? <img src={org.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={18} color="#16a34a" />}
                  </div>
                  <div>
                    <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, margin: 0 }}>{org.display_name}</p>
                    <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>{org.schema_name}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  <button aria-label="Edit organisation" title="Edit organisation" onClick={() => setModal({ org })} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; }} onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#f8fafc'; }}>
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(org.id)} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Direct Access Link Badge */}
              <div style={{
                marginBottom: '12px', padding: '8px 10px', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Link2 size={13} color="#15803d" />
                  <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    /login?tenant={org.schema_name}
                  </span>
                </div>
                <button
                  onClick={() => copyDirectLink(org.schema_name)}
                  style={{
                    padding: '4px 8px', background: copiedSchema === org.schema_name ? '#15803d' : '#ffffff',
                    border: '1px solid #cbd5e1', borderRadius: '6px',
                    color: copiedSchema === org.schema_name ? '#ffffff' : '#334155',
                    fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                  }}
                >
                  {copiedSchema === org.schema_name ? <Check size={11} /> : <Copy size={11} />}
                  {copiedSchema === org.schema_name ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <MapPin size={12} color="#64748b" />
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                  {org.map_center_lat.toFixed(4)}, {org.map_center_lon.toFixed(4)}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(org.allowed_crops || []).map(c => (
                  <span key={c} style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    background: 'rgba(22,163,74,0.08)', color: '#16a34a',
                    border: '1px solid rgba(22,163,74,0.15)',
                  }}>{CROP_LABELS[c] || c}</span>
                ))}
                {(!org.allowed_crops || org.allowed_crops.length === 0) && (
                  <span style={{ color: '#475569', fontSize: '11px', fontStyle: 'italic' }}>No crops configured</span>
                )}
              </div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontSize: '11px', fontWeight: 700 }}>
                <Layers size={12} /> View farms & boundaries →
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <OrgModal org={modal.org} onSave={handleSave} onClose={() => setModal(null)} />}
      {detailOrg && <OrgDetailPanel org={detailOrg} onClose={() => setDetailOrg(null)} />}
    </div>
  );
};

export default Organizations;
