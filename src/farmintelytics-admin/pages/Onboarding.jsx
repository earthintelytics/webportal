import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, Key, Settings, Check, ChevronRight, AlertCircle, X, Copy, Rocket, UploadCloud, Filter, Plus, MapPin } from 'lucide-react';
import {
  createOrganization, createCredential, createFarm, uploadBoundary, generateFarmConfig, generateParentConfig,
  createSchedulerJob, uploadOrganizationLogo, getBoundaryProperties, updateOrganization,
} from '../../services/adminApi';
import { slugify, modulesForAccessModel, ACCESS_MODELS, ALL_RS_INDICES } from './Organizations';
import ErrorBanner from '../components/ErrorBanner';
import { SENSOR_OPTIONS, ALL_CROPS, toggleInList, chipStyle } from '../components/formHelpers';

const CROP_LABELS = {
  ffb: 'Oil Palm (FFB)', maize: 'Maize', rice: 'Rice', cocoa: 'Cocoa',
  rubber: 'Rubber', cassava: 'Cassava', sugarcane: 'Sugarcane', cashew: 'Cashew',
};
const ALL_INDICES = ['NDVI', 'EVI', 'NDMI', 'RECI', 'NDWI', 'LSWI', 'LAI', 'NDRE', 'CVI', 'SAVI', 'MSI', 'GNDVI', 'ETC', 'LST', 'SMI_LANDSAT', 'VCI'];

const STEPS = [
  { id: 'organization', label: 'Organization Setup', icon: Building2 },
  { id: 'filters', label: 'Dashboard Filters', icon: Filter },
  { id: 'credentials', label: 'Login Credentials', icon: Key },
  { id: 'pipeline', label: 'Pipeline Config', icon: Settings },
];

const DEFAULT_ALERT_THRESHOLDS = {
  alert_ndvi_drop_pct: 0.25,
  alert_smi_critical: 0.2,
  alert_ndmi_water_stress_critical: 0.0,
  alert_ndvi_health_critical: 0.35,
};

const inputStyle = {
  width: '100%', padding: '11px 13px', background: '#ffffff', border: '1px solid #cbd5e1',
  borderRadius: '10px', color: '#0f172a', fontSize: '14px', fontWeight: 500,
  outline: 'none', boxSizing: 'border-box', fontFamily: "var(--font-sans)",
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', letterSpacing: '0.04em', marginBottom: '6px', fontFamily: "var(--font-sans)" };
const helpTextStyle = { color: '#64748b', fontSize: '13px', margin: '6px 0 0', lineHeight: 1.5, fontFamily: "var(--font-sans)" };
const chip = chipStyle;
const primaryBtn = (disabled) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 26px',
  background: '#15803d', border: 'none', borderRadius: '12px',
  color: 'white', cursor: disabled ? 'default' : 'pointer', fontWeight: 600, fontSize: '14px',
  opacity: disabled ? 0.5 : 1, fontFamily: "var(--font-sans)",
});
const secondaryBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 22px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#334155', cursor: 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: "var(--font-sans)" };

const FitToBounds = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    try {
      const bounds = L.geoJSON(data).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch { /* malformed geometry */ }
  }, [data, map]);
  return null;
};

// The "Organization Setup" step covers company + first farm + its boundary —
// too much for one long scroll, so it's split into its own mini flow with
// Back/Next instead of dumping every field on screen at once.
const ORG_SUBSTEPS = [
  { id: 'company', label: 'Company' },
  { id: 'access', label: 'Access Model' },
  { id: 'farm', label: 'Farm' },
  { id: 'boundary', label: 'Boundary' },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [orgSubStep, setOrgSubStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Results carried forward between steps
  const [done, setDone] = useState({ org: null, credential: null, farm: null, farms: [], boundary: null, boundaries: [], config: null });

  // ── Step forms ──
  const [company, setCompany] = useState({ company_name: '', schema_name: '', map_center_lat: 6.43, map_center_lon: 5.27, accessModel: 'organization', allowed_crops: [], allowed_indices: [] });
  const [cred, setCred] = useState({ email: '', access_code: '', label: 'Primary', full_name: '', role: 'admin' });
  const [farm, setFarm] = useState({
    farm_name: '', farm_id: '', sensors: ['sentinel-2', 'sentinel-1'],
    indices: ['NDVI', 'EVI', 'NDMI', 'RECI', 'NDWI', 'LSWI'],
    processing_level: 'plot_level', cloud_cover_threshold: 10, start_date: '', end_date: '',
  });
  const [boundaryFile, setBoundaryFile] = useState(null);
  const [previewGeoJSON, setPreviewGeoJSON] = useState(null);

  const computeGeoJSONCenter = (geojson) => {
    if (!geojson) return null;
    const coords = [];
    const extract = (obj) => {
      if (!obj) return;
      const t = obj.type;
      if (t === 'FeatureCollection' && Array.isArray(obj.features)) {
        obj.features.forEach(extract);
      } else if (t === 'Feature') {
        extract(obj.geometry);
      } else if (['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'].includes(t)) {
        const geomCoords = obj.coordinates || [];
        const flatten = (lst, depth) => {
          if (depth === 1) {
            lst.forEach(pt => {
              if (Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1])) {
                coords.push(pt);
              }
            });
          } else {
            lst.forEach(sub => {
              if (Array.isArray(sub)) flatten(sub, depth - 1);
            });
          }
        };
        if (t === 'Polygon') flatten(geomCoords, 2);
        else if (t === 'MultiPolygon') flatten(geomCoords, 3);
        else if (t === 'LineString') flatten(geomCoords, 1);
        else if (t === 'MultiLineString') flatten(geomCoords, 2);
      }
    };
    extract(geojson);
    if (coords.length === 0) return null;
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lon: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  };

  useEffect(() => {
    if (!boundaryFile) {
      setPreviewGeoJSON(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        setPreviewGeoJSON(parsed);
        const center = computeGeoJSONCenter(parsed);
        if (center) {
          setCompany(c => ({
            ...c,
            map_center_lat: parseFloat(center.lat.toFixed(6)),
            map_center_lon: parseFloat(center.lon.toFixed(6)),
          }));
        }
      } catch {
        setPreviewGeoJSON(null);
      }
    };
    reader.readAsText(boundaryFile);
  }, [boundaryFile]);

  // Okomu-style setups: several farms/estates run separately then merged by
  // ParentSyncManager. When on, Farm+Boundary repeat for each sub-farm
  // instead of advancing straight to Credentials.
  const [isParent, setIsParent] = useState(false);
  const [parentFarmId, setParentFarmId] = useState('');
  const [parentFarmName, setParentFarmName] = useState('');
  const [subFarms, setSubFarms] = useState([]); // completed sub-farms, each { ...farmFields, boundaryFile }
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [scheduleCron, setScheduleCron] = useState('0 3 */5 * *');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef(null);

  // ── Dashboard filters + alert thresholds (step 1) ──
  const [filterOptions, setFilterOptions] = useState([]); // [{key, sample_values}] unioned across sub-farm boundaries
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [selectedFilterKeys, setSelectedFilterKeys] = useState([]);
  const [alertThresholds, setAlertThresholds] = useState(DEFAULT_ALERT_THRESHOLDS);
  // Off by default — a forward-filled point is a carried-forward value, not
  // a real measurement, so this is an explicit opt-in per org.
  const [enableFfill, setEnableFfill] = useState(false);

  useEffect(() => {
    if (step !== 1 || !done.farms?.length) return;
    setLoadingFilters(true);
    (async () => {
      try {
        const results = await Promise.all(done.farms.map(f => getBoundaryProperties(f.farm_id).catch(() => ({ properties: [] }))));
        const byKey = new Map();
        for (const r of results) {
          for (const p of (r.properties || [])) {
            if (!byKey.has(p.key)) byKey.set(p.key, p);
          }
        }
        setFilterOptions([...byKey.values()]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingFilters(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !done.org) return;
    setUploadingLogo(true);
    setLogoError('');
    try {
      const updated = await uploadOrganizationLogo(done.org.id, file);
      setLogoUrl(updated.logo_url || '');
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const companySlug = company.schema_name.trim() || slugify(company.company_name);
  const toggleIn = toggleInList;

  const canLeaveCompanyStep = company.company_name.trim();
  const canLeaveAccessStep = company.accessModel === 'organization' || company.allowed_crops.length > 0;
  const canLeaveFarmStep = farm.farm_name.trim() && farm.sensors.length > 0 && farm.indices.length > 0;

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  // ── Step actions ──
  // Company + Farm Registry + Boundary Upload used to be three separate steps.
  // A company almost always onboards with exactly one initial farm, so they're
  // combined into a single "Organization Setup" step — one submit runs all
  // three API calls in sequence rather than requiring three separate screens.
  const effectiveParentFarmId = () => parentFarmId.trim() || `${companySlug}_farm`;
  const effectiveParentFarmName = () => parentFarmName.trim() || `${company.company_name} (Combined)`;

  const submitOrganization = () => run(async () => {
    // If a sub-farm partway through the loop below previously failed, org
    // (and any earlier sub-farms) are already sitting in `done` from that
    // attempt — retrying used to redo everything from scratch, hitting a
    // "schema already exists" error on the org and leaving the admin with
    // orphaned backend records and no path forward except starting over.
    // Reuse what already succeeded instead of recreating it.
    let org = done.org;
    if (!org) {
      const allowed_modules = modulesForAccessModel(company.accessModel, company.allowed_crops, companySlug);
      org = await createOrganization({
        company_name: company.company_name,
        schema_name: companySlug,
        allowed_crops: company.allowed_crops,
        allowed_modules,
        allowed_indices: company.allowed_indices,
        map_center_lat: company.map_center_lat,
        map_center_lon: company.map_center_lon,
      });
      setDone(d => ({ ...d, org }));
    }

    // Standalone farm (the common case) is just [current form]; a parent
    // setup is every previously-added sub-farm plus the one on screen now,
    // all stamped with the same parent_farm_id/name so the pipeline's
    // group_subfarms() merges them at run time exactly like Okomu's
    // hand-authored batch config does today.
    const farmsToCreate = isParent ? [...subFarms, { ...farm, boundaryFile }] : [{ ...farm, boundaryFile }];
    const alreadyCreatedIds = new Set((done.farms || []).map(f => f.farm_id));
    const createdFarms = [...(done.farms || [])];
    const boundaries = [...(done.boundaries || [])];
    for (const f of farmsToCreate) {
      const farmId = f.farm_id.trim();
      if (alreadyCreatedIds.has(farmId)) continue;
      const createdFarm = await createFarm({
        company_name: company.company_name,
        company_id: org.schema_name,
        farm_name: f.farm_name,
        farm_id: farmId,
        parent_farm_id: isParent ? effectiveParentFarmId() : '',
        parent_farm_name: isParent ? effectiveParentFarmName() : '',
        sensors: f.sensors,
        indices: f.indices,
        processing_level: f.processing_level,
        cloud_cover_threshold: f.cloud_cover_threshold,
        start_date: f.start_date || null,
        end_date: f.end_date || null,
      });
      const boundary = await uploadBoundary(createdFarm.farm_id, f.boundaryFile);
      createdFarms.push(createdFarm);
      boundaries.push(boundary);
      // Persist progress after EACH farm, not just once the whole loop
      // finishes — if farm N+1 fails, this run's already-created farms
      // stay recorded so a retry only attempts what's actually missing.
      setDone(d => ({ ...d, org, farm: createdFarms[0], farms: [...createdFarms], boundary: boundaries[0], boundaries: [...boundaries] }));
    }

    setStep(1);
  });

  const submitFilters = () => run(async () => {
    if (done.org) {
      await updateOrganization(done.org.id, {
        dashboard_filter_keys: selectedFilterKeys,
        ...alertThresholds,
        enable_timeseries_ffill: enableFfill,
      });
    }
    setStep(2);
  });

  const submitCredential = () => run(async () => {
    const credential = await createCredential({
      company_id: done.org?.schema_name || companySlug,
      email: cred.email,
      access_code: cred.access_code,
      label: cred.label || 'Primary',
      full_name: cred.full_name,
      role: cred.role,
    });
    setDone(d => ({ ...d, credential }));
    setStep(3);
  });

  const submitConfig = () => run(async () => {
    const res = isParent
      ? await generateParentConfig(effectiveParentFarmId())
      : await generateFarmConfig(done.farm.farm_id);
    const jobName = isParent ? effectiveParentFarmId() : done.farm.farm_id;
    let scheduler = null;
    if (autoSchedule) {
      try {
        scheduler = await createSchedulerJob({
          name: `${jobName}_scheduled_monitoring`,
          description: `Scheduled pipeline run for ${isParent ? effectiveParentFarmName() : done.farm.farm_name} (created by onboarding wizard)`,
          cron: scheduleCron,
          config_path: `configs/${res.filename}`,
          is_batch: true,
          enabled: true,
        });
      } catch (e) {
        // Config generated fine — surface the scheduler failure without losing progress
        setError(`Config generated, but scheduler job failed: ${e.message}`);
      }
    }
    setDone(d => ({ ...d, config: res, scheduler }));
    setStep(4);
  });

  const copyText = (text) => navigator.clipboard?.writeText(text);

  // ── Render helpers ──
  const StepHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const state = i < step ? 'done' : i === step ? 'active' : 'pending';
        return (
          <React.Fragment key={s.id}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px',
              background: state === 'active' ? '#15803d' : '#ffffff',
              border: state === 'active' ? '1px solid #15803d' : state === 'done' ? '1px solid #15803d' : '1px solid #cbd5e1',
              boxShadow: 'none',
              transition: 'all 0.15s ease',
            }}>
              {state === 'done'
                ? <Check size={14} color="#15803d" strokeWidth={3} />
                : <Icon size={14} color={state === 'active' ? '#ffffff' : '#64748b'} />}
              <span style={{ fontSize: '12px', fontWeight: 600, color: state === 'active' ? '#ffffff' : state === 'done' ? '#15803d' : '#64748b' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} color="#94a3b8" />}
          </React.Fragment>
        );
      })}
    </div>
  );

  const card = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box', fontFamily: "var(--font-sans)" };

  // Small "Step 1 of 3" indicator for the Company → Farm → Boundary mini flow.
  const OrgSubStepHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {ORG_SUBSTEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: i === orgSubStep ? '#15803d' : i < orgSubStep ? '#15803d' : '#64748b',
            fontSize: '13px', fontWeight: i === orgSubStep ? 800 : 600,
          }}>
            <span style={{
              width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === orgSubStep ? '#15803d' : i < orgSubStep ? '#15803d' : '#f1f5f9',
              color: i <= orgSubStep ? '#ffffff' : '#64748b', fontSize: '11px', fontWeight: 600,
            }}>{i < orgSubStep ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
            {s.label}
          </div>
          {i < ORG_SUBSTEPS.length - 1 && <div style={{ width: '20px', height: '1px', background: '#cbd5e1' }} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box', fontFamily: "var(--font-sans)" }}>
    <div style={{ width: '100%', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Rocket size={20} color="#16a34a" /> Company Onboarding
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, margin: '4px 0 0' }}>
          Set up a new company: organization + farm details, optional dashboard filters, login credentials, then pipeline config.
        </p>
      </div>

      <StepHeader />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* ── STEP 1: Company + Farm + Boundary, as its own mini Next-button flow ── */}
      {step === 0 && (
        <div style={card}>
          <OrgSubStepHeader />

          {orgSubStep === 0 && (
            <>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>Tell us the company's name and which crops and satellite data they can see.</p>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input style={inputStyle} placeholder="Company display name" value={company.company_name} onChange={e => setCompany(c => ({ ...c, company_name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Schema / Slug ID</label>
                <input style={inputStyle} placeholder={companySlug || 'auto-generated from name'} value={company.schema_name} onChange={e => setCompany(c => ({ ...c, schema_name: e.target.value }))} />
                <p style={helpTextStyle}>Leave blank and we'll generate one from the name: <code style={{ color: '#16a34a' }}>{companySlug || '—'}</code></p>
              </div>
              <button onClick={() => setOrgSubStep(1)} disabled={!canLeaveCompanyStep} style={primaryBtn(!canLeaveCompanyStep)}>
                Next: Access Model <ChevronRight size={15} />
              </button>
            </>
          )}

          {orgSubStep === 1 && (
            <>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>Choose how {company.company_name || 'this company'}'s users will see the platform, and what they're licensed to view.</p>
              <div>
                <label style={labelStyle}>Access Model</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {ACCESS_MODELS.map(m => {
                    const active = company.accessModel === m.id;
                    return (
                      <button key={m.id} onClick={() => setCompany(c => ({ ...c, accessModel: m.id }))} style={{
                        padding: '11px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                        background: active ? 'rgba(22,163,74,0.1)' : '#ffffff',
                        border: active ? '1px solid rgba(22,163,74,0.4)' : '1px solid #cbd5e1',
                      }}>
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: active ? '#15803d' : '#334155' }}>{m.label}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <p style={helpTextStyle}>Want both an org-wide dashboard and per-crop portals? Onboard this company twice — one organization per access model — so each is managed separately.</p>
              </div>
              {company.accessModel === 'crop' && (
                <div>
                  <label style={labelStyle}>Allowed Crops</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {ALL_CROPS.map(c => (
                      <button key={c} onClick={() => setCompany(co => ({ ...co, allowed_crops: toggleIn(co.allowed_crops, c) }))} style={chip(company.allowed_crops.includes(c))}>
                        {CROP_LABELS[c]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label style={labelStyle}>Allowed Satellite Indices</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  {ALL_RS_INDICES.map(ix => (
                    <button key={ix.id} onClick={() => setCompany(co => ({ ...co, allowed_indices: toggleIn(co.allowed_indices, ix.id) }))} style={chip(company.allowed_indices.includes(ix.id))}>
                      {ix.label}
                    </button>
                  ))}
                </div>
                <p style={helpTextStyle}>These are the only layers this company will see. Leave all unchecked to show everything.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setOrgSubStep(0)} style={secondaryBtn}>Back</button>
                <button
                  onClick={() => {
                    // Farm's "Indices to Compute" used to always start empty,
                    // forcing the same indices to be re-picked right after
                    // choosing them here as "Allowed Satellite Indices" —
                    // pre-fill from that selection (only where the two lists
                    // overlap) so it's an edit, not a from-scratch redo.
                    if (company.allowed_indices.length > 0) {
                      const carried = ALL_INDICES.filter(i => company.allowed_indices.includes(i.toLowerCase()));
                      if (carried.length > 0) setFarm(f => ({ ...f, indices: carried }));
                    }
                    setOrgSubStep(2);
                  }}
                  disabled={!canLeaveAccessStep}
                  style={{ ...primaryBtn(!canLeaveAccessStep), flex: 1 }}
                >
                  Next: Farm <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {orgSubStep === 2 && (
            <>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                {isParent
                  ? `Add sub-farm #${subFarms.length + 1} for ${company.company_name || 'this company'} (parent: ${effectiveParentFarmId()}).`
                  : `Now add the first farm or estate for ${company.company_name || 'this company'}.`}
              </p>
              <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  <input type="checkbox" checked={isParent} onChange={e => setIsParent(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#16a34a' }} />
                  This organization has multiple farms run separately and merged into one parent (e.g. several estates)
                </label>
                {isParent && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Parent Farm ID</label>
                      <input style={inputStyle} placeholder={`${companySlug}_farm`} value={parentFarmId} onChange={e => setParentFarmId(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Parent Farm Name</label>
                      <input style={inputStyle} placeholder={`${company.company_name || 'Company'} (Combined)`} value={parentFarmName} onChange={e => setParentFarmName(e.target.value)} />
                    </div>
                  </div>
                )}
                {isParent && <p style={{ ...helpTextStyle, margin: 0 }}>You'll add each sub-farm and its own boundary file one at a time on the next steps — they'll all be tagged with this shared parent so the pipeline merges them automatically.</p>}
              </div>
              <div>
                <label style={labelStyle}>Farm / Estate Name *</label>
                <input style={inputStyle} placeholder="Farm or estate name" value={farm.farm_name} onChange={e => setFarm(f => ({ ...f, farm_name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Farm ID</label>
                <input style={inputStyle} placeholder={`Leave blank for auto: ${companySlug}_${slugify(farm.farm_name) || '…'}`} value={farm.farm_id} onChange={e => setFarm(f => ({ ...f, farm_id: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Sensors</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {SENSOR_OPTIONS.map(s => (
                    <button key={s} onClick={() => setFarm(f => ({ ...f, sensors: toggleIn(f.sensors, s) }))} style={chip(farm.sensors.includes(s), '#3b82f6')}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Indices to Compute</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ALL_INDICES.map(i => (
                    <button key={i} onClick={() => setFarm(f => ({ ...f, indices: toggleIn(f.indices, i) }))} style={chip(farm.indices.includes(i))}>{i}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Processing Level</label>
                  <select style={inputStyle} value={farm.processing_level} onChange={e => setFarm(f => ({ ...f, processing_level: e.target.value }))}>
                    <option value="plot_level">Plot Level</option>
                    <option value="farm_level">Farm Level</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Max Cloud Cover %</label>
                  <input type="number" min="0" max="100" style={inputStyle} value={farm.cloud_cover_threshold} onChange={e => setFarm(f => ({ ...f, cloud_cover_threshold: parseInt(e.target.value || '0', 10) }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Start Date (optional)</label>
                  <input type="date" style={inputStyle} value={farm.start_date} onChange={e => setFarm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>End Date (optional)</label>
                  <input type="date" style={inputStyle} value={farm.end_date} onChange={e => setFarm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 6].map(months => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(start.getMonth() - months);
                      const iso = d => d.toISOString().slice(0, 10);
                      setFarm(f => ({ ...f, start_date: iso(start), end_date: iso(end) }));
                    }}
                    style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', cursor: 'pointer' }}
                  >
                    Backfill {months}mo
                  </button>
                ))}
              </div>
              <p style={helpTextStyle}>
                Leave the dates blank to just start monitoring from today. To also pull older satellite images,
                pick a start date in the past (or use a button above).
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setOrgSubStep(1)} style={secondaryBtn}>Back</button>
                <button onClick={() => setOrgSubStep(3)} disabled={!canLeaveFarmStep} style={{ ...primaryBtn(!canLeaveFarmStep), flex: 1 }}>
                  Next: Boundary <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {orgSubStep === 3 && (
            <>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>Last step — upload the farm's boundary as a GeoJSON file.</p>
              <div>
                <label style={labelStyle}>Boundary GeoJSON *</label>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '32px',
                  border: '2px dashed #cbd5e1', borderRadius: '14px', cursor: 'pointer', background: '#f8fafc',
                }}>
                  <UploadCloud size={28} color={boundaryFile ? '#16a34a' : '#94a3b8'} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: boundaryFile ? '#16a34a' : '#475569' }}>
                    {boundaryFile ? boundaryFile.name : 'Click to choose a .geojson file'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>A polygon or multi-polygon of the farm's outline</span>
                  <input type="file" accept=".geojson,.json,application/geo+json" style={{ display: 'none' }} onChange={e => setBoundaryFile(e.target.files?.[0] || null)} />
                </label>
                <p style={helpTextStyle}>
                  This is exactly the file the pipeline will read for <strong>{farm.farm_name || 'this farm'}</strong>.
                </p>
                {previewGeoJSON && (
                  <div style={{ marginTop: '14px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1', height: '240px', position: 'relative' }}>
                    <MapContainer preferCanvas={true} center={[6.43, 5.27]} zoom={11} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" maxZoom={19} />
                      <GeoJSON data={previewGeoJSON} style={{ color: '#16a34a', weight: 2.5, fillColor: '#22c55e', fillOpacity: 0.25 }} />
                      <FitToBounds data={previewGeoJSON} />
                    </MapContainer>
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000, background: 'rgba(15,23,42,0.85)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#22c55e' }}>✓</span> GeoJSON Boundary Preview • Center: {company.map_center_lat}, {company.map_center_lon}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setOrgSubStep(2)} style={secondaryBtn}>Back</button>
                {isParent && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubFarms(sf => [...sf, { ...farm, boundaryFile }]);
                      setFarm(f => ({ ...f, farm_name: '', farm_id: '' }));
                      setBoundaryFile(null);
                      setOrgSubStep(2);
                    }}
                    disabled={!boundaryFile}
                    style={{ ...secondaryBtn, opacity: !boundaryFile ? 0.5 : 1 }}
                  >
                    <Plus size={15} /> Add Another Sub-Farm
                  </button>
                )}
                <button
                  onClick={submitOrganization}
                  disabled={busy || !boundaryFile}
                  style={{ ...primaryBtn(busy || !boundaryFile), flex: 1 }}
                >
                  {busy ? 'Creating…' : isParent ? `Finish — Create Organization (${subFarms.length + 1} sub-farms)` : 'Create Organization + Farm'} <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 1B (new): Dashboard Filters + Alert Thresholds ── */}
      {step === 1 && (
        <div style={card}>
          <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: 700, margin: 0 }}>
            ✓ {done.farms?.length > 1 ? `${done.farms.length} sub-farms` : 'Farm'} + boundary uploaded
          </p>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            Optional — pick up to 4 boundary-file columns (found in the GeoJSON you just uploaded) to show as
            filter dropdowns on this org's dashboard. Leave none selected to skip filters entirely.
          </p>
          {loadingFilters && <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Reading boundary properties…</p>}
          {!loadingFilters && filterOptions.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No named columns found in the uploaded boundary file.</p>
          )}
          {!loadingFilters && filterOptions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {filterOptions.map(opt => {
                const active = selectedFilterKeys.includes(opt.key);
                const disabled = !active && selectedFilterKeys.length >= 4;
                return (
                  <button
                    key={opt.key}
                    disabled={disabled}
                    onClick={() => setSelectedFilterKeys(keys => active ? keys.filter(k => k !== opt.key) : [...keys, opt.key])}
                    title={opt.sample_values?.length ? `e.g. ${opt.sample_values.slice(0, 3).join(', ')}` : ''}
                    style={{ ...chip(active), opacity: disabled ? 0.4 : 1 }}
                  >
                    {opt.key}
                  </button>
                );
              })}
            </div>
          )}
          <p style={helpTextStyle}>{selectedFilterKeys.length}/4 selected.</p>

          <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>Alert Thresholds (optional)</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Defaults match what every organization uses today — only change these if this org needs different sensitivity.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>NDVI/SAVI/EVI Drop %</label>
                <input type="number" step="0.01" min="0" max="1" style={inputStyle}
                  value={alertThresholds.alert_ndvi_drop_pct}
                  onChange={e => setAlertThresholds(t => ({ ...t, alert_ndvi_drop_pct: parseFloat(e.target.value || '0') }))} />
              </div>
              <div>
                <label style={labelStyle}>SMI Critical</label>
                <input type="number" step="0.01" style={inputStyle}
                  value={alertThresholds.alert_smi_critical}
                  onChange={e => setAlertThresholds(t => ({ ...t, alert_smi_critical: parseFloat(e.target.value || '0') }))} />
              </div>
              <div>
                <label style={labelStyle}>NDMI Water Stress Critical</label>
                <input type="number" step="0.01" style={inputStyle}
                  value={alertThresholds.alert_ndmi_water_stress_critical}
                  onChange={e => setAlertThresholds(t => ({ ...t, alert_ndmi_water_stress_critical: parseFloat(e.target.value || '0') }))} />
              </div>
              <div>
                <label style={labelStyle}>NDVI Health Critical</label>
                <input type="number" step="0.01" style={inputStyle}
                  value={alertThresholds.alert_ndvi_health_critical}
                  onChange={e => setAlertThresholds(t => ({ ...t, alert_ndvi_health_critical: parseFloat(e.target.value || '0') }))} />
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <input type="checkbox" checked={enableFfill} onChange={e => setEnableFfill(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#16a34a', marginTop: '1px' }} />
            <span>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155' }}>Forward-fill gaps in time-series charts</span>
              <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                When a date has no clean satellite scene (cloud cover, no pass), carry forward the last real reading instead of leaving a gap. Off by default — carried-forward points are flagged, not presented as new measurements.
              </span>
            </span>
          </label>

          <button onClick={submitFilters} disabled={busy} style={primaryBtn(busy)}>
            {busy ? 'Saving…' : 'Continue'} <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Credentials ── */}
      {step === 2 && (
        <div style={card}>
          <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: 700, margin: 0 }}>
            ✓ Organization "{done.org?.display_name}" created
          </p>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>Now create a login for this company.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Account Holder Name</label>
              <input style={inputStyle} placeholder="Full name" value={cred.full_name} onChange={e => setCred(c => ({ ...c, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Account Role</label>
              <select style={inputStyle} value={cred.role} onChange={e => setCred(c => ({ ...c, role: e.target.value }))}>
                <option value="admin">Admin — full organization access</option>
                <option value="analyst">Analyst — monitoring & reports</option>
                <option value="viewer">Viewer — read-only</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Login Email *</label>
            <input style={inputStyle} placeholder="Company login email" value={cred.email} onChange={e => setCred(c => ({ ...c, email: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Access Code (password)</label>
              <input style={inputStyle} placeholder="Blank = auto-generate" value={cred.access_code} onChange={e => setCred(c => ({ ...c, access_code: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Label</label>
              <input style={inputStyle} value={cred.label} onChange={e => setCred(c => ({ ...c, label: e.target.value }))} />
            </div>
          </div>
          <button onClick={submitCredential} disabled={busy || !cred.email.trim()} style={primaryBtn(busy || !cred.email.trim())}>
            {busy ? 'Creating…' : 'Create Credential'} <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 3: Pipeline config ── */}
      {step === 3 && (
        <div style={card}>
          <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: 700, margin: 0 }}>✓ Organization, farm and boundary are all set up</p>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            Last step — create the pipeline's run config for this farm, using the sensors and indices you picked.
          </p>
          <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              <input type="checkbox" checked={autoSchedule} onChange={e => setAutoSchedule(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#16a34a' }} />
              Also schedule it to run automatically
            </label>
            {autoSchedule && (
              <div>
                <label style={labelStyle}>Cron Schedule</label>
                <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)', maxWidth: '220px' }} value={scheduleCron} onChange={e => setScheduleCron(e.target.value)} />
                <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0' }}>Default runs at 03:00 every 5 days (same cadence as the existing all-farms job).</p>
              </div>
            )}
          </div>
          <button onClick={submitConfig} disabled={busy || (autoSchedule && !scheduleCron.trim())} style={primaryBtn(busy)}>
            {busy ? 'Generating…' : autoSchedule ? 'Generate Config + Schedule Job' : 'Generate Pipeline Config'} <Settings size={15} />
          </button>
        </div>
      )}

      {/* ── DONE ── */}
      {step === 4 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={22} color="#16a34a" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{done.org?.display_name} onboarded</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Config: <code>{done.config?.filename}</code></p>
            </div>
          </div>
          <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={20} color="#94a3b8" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Branding Logo</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Optional — shown on the portal hub and this org's login screen.</p>
              {logoError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#dc2626' }}>{logoError}</p>}
            </div>
            <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} style={{ padding: '9px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#334155', cursor: 'pointer', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
              {uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace' : 'Upload'}
            </button>
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={handleLogoFile} />
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', color: '#475569', fontSize: '12.5px', lineHeight: 2 }}>
            <li>Organization + access model saved — users see only their licensed modules.</li>
            <li>Login: <strong>{done.credential?.email}</strong> / <code>{done.credential?.access_code}</code></li>
            {done.boundaries?.length > 1
              ? <li>{done.boundaries.length} sub-farm boundaries uploaded to MinIO (parent: <code>{effectiveParentFarmId()}</code>).</li>
              : <li>Boundary in MinIO at <code>{done.boundary?.minio_path}</code></li>}
            {selectedFilterKeys.length > 0 && <li>Dashboard filters: <code>{selectedFilterKeys.join(', ')}</code></li>}
            <li>Pipeline config <code>{done.config?.filename}</code> written to the shared configs folder{done.config?.sub_farms ? ` (covers ${done.config.sub_farms.length} sub-farms)` : ''}.</li>
            {done.scheduler
              ? <li>Scheduler job <code>{done.scheduler.name}</code> active (<code>{done.scheduler.cron}</code>) — dashboards fill with real data after the first run.</li>
              : <li>No scheduler job created — add one under Scheduler pointing at the config, or run the pipeline manually.</li>}
          </ul>
          {done.config?.content && (
            <pre style={{ margin: 0, padding: '14px', background: '#0f172a', color: '#86efac', borderRadius: '12px', fontSize: '11px', overflowX: 'auto', maxHeight: '240px' }}>{done.config.content}</pre>
          )}
          <button onClick={() => {
            setStep(0); setOrgSubStep(0);
            setDone({ org: null, credential: null, farm: null, farms: [], boundary: null, boundaries: [], config: null });
            setCompany({ company_name: '', schema_name: '', map_center_lat: 6.43, map_center_lon: 5.27, accessModel: 'organization', allowed_crops: [], allowed_indices: [] });
            setLogoUrl(''); setLogoError('');
            setCred({ email: '', access_code: '', label: 'Primary', full_name: '', role: 'admin' });
            setFarm(f => ({ ...f, farm_name: '', farm_id: '' }));
            setBoundaryFile(null);
            setIsParent(false); setParentFarmId(''); setParentFarmName(''); setSubFarms([]);
            setFilterOptions([]); setSelectedFilterKeys([]); setAlertThresholds(DEFAULT_ALERT_THRESHOLDS); setEnableFfill(false);
          }} style={primaryBtn(false)}>
            <Rocket size={15} /> Onboard Another Company
          </button>
        </div>
      )}
    </div>
    </div>
  );
};

export default Onboarding;
