import { useState, useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, ChevronDown, Copy, Rocket, UploadCloud, Plus, Trash2, MapPin, AlertTriangle, Building2, ExternalLink } from 'lucide-react';
import {
  createOrganization, createCredential, createFarm, uploadBoundary, generateFarmConfig, generateParentConfig,
  createSchedulerJob, uploadOrganizationLogo, getBoundaryProperties, updateOrganization, runSchedulerJob,
} from '../../services/adminApi';
import { slugify, ALL_RS_INDICES } from '../components/orgConstants';
import ErrorBanner from '../components/ErrorBanner';
import { SENSOR_OPTIONS, ALL_CROPS, toggleInList } from '../components/formHelpers';
import { WEEKDAYS, cronFor, cronError, scheduleText as scheduleWords } from '../components/schedule';
import { emailError, slugError, accessCodeError, boundaryCheck } from '../components/validation';
import { CustomRule } from './Scheduler';
const scheduleText = (s) => { const w = scheduleWords(s); return w.charAt(0).toLowerCase() + w.slice(1); };
import { CROP_PHOTOS, SERVICE_PHOTOS, SERVICE_GROUPS, SERVICE_PACKAGES } from '../../constants/servicePhotos';
import { HERO_PLACEHOLDERS } from '../../constants/heroPlaceholders';
import { SERVICE_CATALOG } from '../../modules/services/serviceCatalog';
import { SMALLHOLDER_SERVICES, resolveModule, moduleName } from '../../modules/registry';
import { DATASET_DEFINITIONS, datasetsForScope } from '../../modules/data/datasetDefinitions';

/**
 * Onboard an organisation — one flow, dynamic by design (docs/FINDINGS.md,
 * "Admin console audit"): organisation → crops and services (with the pages
 * each brings) → estates (as many as needed, each with its boundary) →
 * blocks and filters → login → schedule → finish (checklist, client links,
 * data the client will be asked for). Every backend call of the previous
 * wizard is kept.
 */

const CROP_LABELS = { ffb: 'Oil palm', maize: 'Maize', rice: 'Rice', cocoa: 'Cocoa', rubber: 'Rubber', cassava: 'Cassava', sugarcane: 'Sugarcane', cashew: 'Cashew' };
const CROP_KEY = { ffb: 'oil_palm' };
const ALL_INDICES = ['NDVI', 'EVI', 'NDMI', 'RECI', 'NDWI', 'LSWI', 'LAI', 'NDRE', 'CVI', 'SAVI', 'MSI', 'GNDVI', 'ETC', 'LST', 'SMI_LANDSAT', 'VCI'];
// Pages a crop portal shows today (shared layout). Per-crop page sets come with the catalogue (D11).
const CROP_PAGES = ['Overview', 'Map', 'Crop health', 'Crop yield', 'Moisture', 'Climate', 'Alerts', 'Farm data'];
const DEFAULT_ALERT_THRESHOLDS = { alert_ndvi_drop_pct: 0.25, alert_smi_critical: 0.2, alert_ndmi_water_stress_critical: 0.0, alert_ndvi_health_critical: 0.35 };
const STEPS = ['Organisation', 'Crops and services', 'Estates', 'Blocks and filters', 'Login', 'Schedule', 'Finish'];
const NEAR_KM = 20; // estates further apart than this are processed separately

const blankEstate = () => ({
  key: Math.random().toString(36).slice(2), farm_name: '', farm_id: '', crop: '', is_irrigated: false,
  boundaryFile: null, geojson: null, centre: null,
  sensors: ['sentinel-2', 'sentinel-1'], indices: ['NDVI', 'EVI', 'NDMI', 'RECI', 'NDWI'],
  processing_level: 'plot_level', cloud_cover_threshold: 10, start_date: '', end_date: '',
});

function geojsonCentre(geojson) {
  try {
    const b = L.geoJSON(geojson).getBounds();
    if (!b.isValid()) return null;
    const c = b.getCenter();
    return { lat: +c.lat.toFixed(6), lon: +c.lng.toFixed(6) };
  } catch { return null; }
}
function distanceKm(a, b) {
  const R = 6371, r = (x) => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const FitToBounds = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    // The card may still be laying out when the map mounts; re-measure so tiles fill it
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    if (!data) return;
    try { const b = L.geoJSON(data).getBounds(); if (b.isValid()) map.fitBounds(b, { padding: [20, 20] }); } catch { /* malformed */ }
  }, [data, map]);
  return null;
};

// ── Small building blocks (portal look: white cards, gray-200 borders, green accents) ──
const Card = ({ className = '', children }) => <div className={`bg-white rounded-2xl border border-gray-200 p-7 space-y-6 ${className}`}>{children}</div>;
const Field = ({ label, hint, children, optional }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-semibold text-gray-800">{label}{optional && <span className="font-normal text-gray-500"> (optional)</span>}</span>
    {children}
    {hint && <span className="block text-xs text-gray-500 leading-relaxed">{hint}</span>}
  </label>
);
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-green-600';
const Primary = ({ disabled, children, ...rest }) => (
  <button disabled={disabled} {...rest} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-500 transition-colors">{children}</button>
);
const Secondary = ({ children, ...rest }) => (
  <button {...rest} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{children}</button>
);
const Toggle = ({ on, label, sub, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-green-700" />
    <span><span className="block text-sm font-semibold text-gray-800">{label}</span>{sub && <span className="block text-xs text-gray-500 mt-0.5">{sub}</span>}</span>
  </label>
);
const Advanced = ({ title = 'Advanced settings', children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700">
        {title}<ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
};
const Chip = ({ on, children, ...rest }) => (
  <button type="button" {...rest} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${on ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>{children}</button>
);
const PhotoCard = ({ photo, title, sub, on, onClick, pages }) => (
  <button type="button" onClick={onClick} className={`text-left rounded-2xl border overflow-hidden bg-white transition-colors ${on ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-200 hover:border-gray-300'}`}>
    <div className="relative h-24 bg-gray-100 bg-cover bg-center" style={photo && HERO_PLACEHOLDERS[photo] ? { backgroundImage: `url(${HERO_PLACEHOLDERS[photo]})` } : undefined}>
      {photo && <img src={photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
      {on && <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-700 text-white flex items-center justify-center"><Check size={14} strokeWidth={3} /></span>}
    </div>
    <div className="p-3">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5 leading-snug">{sub}</div>}
      {on && pages && <div className="text-[11px] text-green-800 mt-2 leading-snug">Pages: {pages.join(' · ')}</div>}
    </div>
  </button>
);

// The wizard keeps a draft on this computer, so a refresh or a closed tab
// never loses the answers or what was already created. Files cannot be
// stored by the browser: boundary files are picked again.
const DRAFT = 'fi_onboarding_draft';
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT) || '{}'); } catch { return {}; } };
const draftValue = (name, initial) => { const d = readDraft(); return d[name] !== undefined ? d[name] : initial; };
const noFiles = (k, v) => (typeof File !== 'undefined' && v instanceof File ? undefined : v);

const Onboarding = () => {
  const [step, setStep] = useState(() => draftValue('step', 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(() => draftValue('done', { org: null, credential: null, farms: [], boundaries: [], configs: [], schedulers: [] }));

  // 1. Organisation
  const [company, setCompany] = useState(() => draftValue('company', { company_name: '', schema_name: '' }));
  const slug = company.schema_name.trim() || slugify(company.company_name);
  // 2. Crops and services
  const [crops, setCrops] = useState(() => draftValue('crops', []));
  const [services, setServices] = useState(() => draftValue('services', []));
  const [allowedIndices, setAllowedIndices] = useState(() => draftValue('allowedIndices', []));
  // 3. Estates
  const [estates, setEstates] = useState(() => (draftValue('estates', null) || [blankEstate()]).map((e) => ({ ...blankEstate(), ...e, key: e.key || blankEstate().key })));
  const [grouped, setGrouped] = useState(() => draftValue('grouped', false)); // neighbouring sub-farms processed as one site
  // 4. Blocks and filters
  const [propOptions, setPropOptions] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [blockKey, setBlockKey] = useState(() => draftValue('blockKey', ''));
  const [estateKey, setEstateKey] = useState(() => draftValue('estateKey', ''));
  const [filterKeys, setFilterKeys] = useState(() => draftValue('filterKeys', []));
  const [thresholds, setThresholds] = useState(() => draftValue('thresholds', DEFAULT_ALERT_THRESHOLDS));
  const [ffill, setFfill] = useState(() => draftValue('ffill', false));
  // 5. Login
  const [cred, setCred] = useState(() => ({ ...draftValue('cred', { full_name: '', email: '', role: 'admin', label: 'Primary' }), access_code: '' }));
  // 6. Schedule
  const [autoSchedule, setAutoSchedule] = useState(() => draftValue('autoSchedule', true));
  const [sched, setSched] = useState(() => draftValue('sched', { mode: 'days', every: 5, weekday: 1, monthday: 1, hour: 3 }));
  // Finish
  const [logoUrl, setLogoUrl] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const logoRef = useRef(null);
  const [copied, setCopied] = useState('');

  // Save the draft as answers change (never the access code or files); clear it once finished.
  useEffect(() => {
    try {
      if (step >= 6) { localStorage.removeItem(DRAFT); return; }
      const { access_code: _omit, ...credNoCode } = cred; // eslint-disable-line no-unused-vars
      localStorage.setItem(DRAFT, JSON.stringify({ step, done, company, crops, services, allowedIndices, estates, grouped, blockKey, estateKey, filterKeys, thresholds, ffill, cred: credNoCode, autoSchedule, sched }, noFiles));
    } catch { /* storage unavailable */ }
  }, [step, done, company, crops, services, allowedIndices, estates, grouped, blockKey, estateKey, filterKeys, thresholds, ffill, cred, autoSchedule, sched]);
  const startOver = () => { try { localStorage.removeItem(DRAFT); } catch { /* storage unavailable */ } window.location.reload(); };
  const hasDraft = Boolean(company.company_name || done.org);

  const run = async (fn) => { setBusy(true); setError(''); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const setEstate = (key, patch) => setEstates(list => list.map(e => e.key === key ? { ...e, ...patch } : e));

  const onBoundary = (key, file) => {
    if (!file) return setEstate(key, { boundaryFile: null, geojson: null, centre: null });
    const reader = new FileReader();
    reader.onload = (ev) => {
      let g;
      try { g = JSON.parse(ev.target.result); } catch { g = null; }
      const check = boundaryCheck(g, file.size);
      setEstate(key, check.error
        ? { boundaryFile: file, geojson: null, centre: null, boundaryError: check.error, boundaryInfo: null }
        : { boundaryFile: file, geojson: g, centre: geojsonCentre(g), boundaryError: null, boundaryInfo: `${check.polygons} polygon${check.polygons > 1 ? 's' : ''}${check.warning ? ` · ${check.warning}` : ''}` });
    };
    reader.readAsText(file);
  };

  // Distances between estates, to warn when "process as one site" joins far-apart estates
  const farApart = useMemo(() => {
    const withC = estates.filter(e => e.centre);
    let max = 0;
    for (let i = 0; i < withC.length; i++) for (let j = i + 1; j < withC.length; j++) max = Math.max(max, distanceKm(withC[i].centre, withC[j].centre));
    return max;
  }, [estates]);

  // Exactly what was chosen: a monitoring service per crop, plus the services.
  const allowedModules = useMemo(() => [...new Set([...crops.map((c) => `rs-${c}`), ...services])], [crops, services]);
  const datasetsAsked = useMemo(() => {
    const keys = [...crops.map(c => `crop:${CROP_KEY[c] || c}`), ...services.map(s => `service:${s}`)];
    return datasetsForScope(DATASET_DEFINITIONS, keys);
  }, [crops, services]);

  // Front-end validation (the backend checks again)
  const slugErr = slugError(company.schema_name.trim());
  const nameCounts = estates.reduce((m, e) => { const k = e.farm_name.trim().toLowerCase(); if (k) m[k] = (m[k] || 0) + 1; return m; }, {});
  const estateErr = (e) => (nameCounts[e.farm_name.trim().toLowerCase()] > 1 ? 'Two estates have this name; give each a different name.'
    : e.farm_id.trim() && slugError(e.farm_id.trim()) ? `Estate ID: ${slugError(e.farm_id.trim())}` : null);
  const emailErr = cred.email ? emailError(cred.email) : null;
  const codeErr = accessCodeError(cred.access_code);

  const canNext = [
    company.company_name.trim() && !slugErr,
    crops.length > 0 || services.length > 0,
    estates.length > 0 && estates.every(e => e.farm_name.trim() && e.boundaryFile && e.geojson && !e.boundaryError && !estateErr(e) && (e.crop || crops.length <= 1)),
    true,
    cred.email.trim() && !emailErr && !codeErr,
    true,
  ];

  // ── Submits (same backend calls as before) ──
  const submitEstates = () => run(async () => {
    let org = done.org;
    // Map centre from the first boundary; never a default location.
    const first = estates.find(e => e.centre)?.centre || { lat: null, lon: null };
    if (!org) {
      org = await createOrganization({
        company_name: company.company_name, schema_name: slug,
        allowed_crops: crops, allowed_modules: allowedModules, allowed_indices: allowedIndices,
        map_center_lat: first.lat, map_center_lon: first.lon,
      });
      setDone(d => ({ ...d, org }));
    }
    const parentId = `${slug}_farm`, parentName = `${company.company_name} (combined)`;
    const created = [...done.farms], boundaries = [...done.boundaries];
    const createdIds = new Set(created.map(f => f.farm_id));
    for (const e of estates) {
      const farmId = e.farm_id.trim() || `${slug}_${slugify(e.farm_name)}`;
      if (createdIds.has(farmId)) continue;
      const farm = await createFarm({
        company_name: company.company_name, company_id: org.schema_name, farm_name: e.farm_name, farm_id: farmId,
        parent_farm_id: grouped ? parentId : '', parent_farm_name: grouped ? parentName : '',
        sensors: e.sensors, indices: e.indices, processing_level: e.processing_level, cloud_cover_threshold: e.cloud_cover_threshold,
        start_date: e.start_date || null, end_date: e.end_date || null,
        crop: e.crop || (crops.length === 1 ? crops[0] : ''), is_irrigated: e.is_irrigated, // stored once the backend has the fields (G7)
      });
      const boundary = await uploadBoundary(farm.farm_id, e.boundaryFile);
      created.push(farm); boundaries.push(boundary);
      setDone(d => ({ ...d, org, farms: [...created], boundaries: [...boundaries] })); // keep progress if a later estate fails
    }
    setLoadingProps(true);
    setStep(3);
  });

  useEffect(() => {
    if (step !== 3 || !done.farms.length) return;
    let active = true;
    Promise.all(done.farms.map(f => getBoundaryProperties(f.farm_id).catch(() => ({ properties: [] }))))
      .then(results => {
        if (!active) return;
        const byKey = new Map();
        results.forEach(r => (r.properties || []).forEach(p => { if (!byKey.has(p.key)) byKey.set(p.key, p); }));
        const opts = [...byKey.values()];
        setPropOptions(opts);
        const guess = (re) => opts.find(o => re.test(o.key))?.key || '';
        setBlockKey(k => k || guess(/^(plot|block|bloc|field)[\s_-]*(id|no|nb|number)?$|^id$/i));
        setEstateKey(k => k || guess(/estate|farm|site|division/i));
      })
      .finally(() => active && setLoadingProps(false));
    return () => { active = false; };
  }, [step, done.farms]);

  const submitBlocks = () => run(async () => {
    await updateOrganization(done.org.id, {
      dashboard_filter_keys: filterKeys, ...thresholds, enable_timeseries_ffill: ffill,
      block_id_key: blockKey || null, estate_key: estateKey || null, // stored once the backend has the fields (G7)
    });
    setStep(4);
  });

  const submitLogin = () => run(async () => {
    const credential = await createCredential({ company_id: done.org.schema_name, ...cred, label: cred.label || 'Primary' });
    setDone(d => ({ ...d, credential }));
    setStep(5);
  });

  const submitSchedule = () => run(async () => {
    const targets = grouped ? [{ id: `${slug}_farm`, name: `${company.company_name} (combined)`, parent: true }]
      : done.farms.map(f => ({ id: f.farm_id, name: f.farm_name, parent: false }));
    const configs = [], schedulers = [];
    for (const [i, t] of targets.entries()) {
      const res = t.parent ? await generateParentConfig(t.id) : await generateFarmConfig(t.id);
      configs.push(res);
      if (autoSchedule) {
        try {
          schedulers.push(await createSchedulerJob({
            name: `${t.id}_scheduled_monitoring`, description: `Satellite monitoring for ${t.name} (set up at onboarding)`,
            cron: cronFor(sched, i * 15), config_path: `configs/${res.filename}`, is_batch: true, enabled: true,
          }));
        } catch (e) { setError(`Config created, but the schedule for ${t.name} failed: ${e.message}`); }
      }
    }
    setDone(d => ({ ...d, configs, schedulers }));
    setStep(6);
  });

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !done.org) return;
    setLogoBusy(true);
    try { setLogoUrl((await uploadOrganizationLogo(done.org.id, file)).logo_url || ''); } catch (err) { setError(err.message); }
    finally { setLogoBusy(false); if (logoRef.current) logoRef.current.value = ''; }
  };
  const copy = (text) => { navigator.clipboard?.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1500); };
  const restart = () => {
    setStep(0); setDone({ org: null, credential: null, farms: [], boundaries: [], configs: [], schedulers: [] });
    setCompany({ company_name: '', schema_name: '' }); setCrops([]); setServices([]); setAllowedIndices([]);
    setEstates([blankEstate()]); setGrouped(false); setPropOptions([]); setBlockKey(''); setEstateKey(''); setFilterKeys([]);
    setThresholds(DEFAULT_ALERT_THRESHOLDS); setFfill(false); setCred({ full_name: '', email: '', access_code: '', role: 'admin', label: 'Primary' });
    setLogoUrl('');
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // The organisation's own address (its hub with every service), then one
  // link per service, and one Smallholder hub link for all smallholder services.
  const hasSmallholder = allowedModules.some(m => SMALLHOLDER_SERVICES.includes(m));
  const clientLinks = [
    { label: `${company.company_name}: all services`, url: `${origin}/org/${slug}/login` },
    ...allowedModules
      .filter(m => !SMALLHOLDER_SERVICES.includes(m) && resolveModule(m))
      .map(m => ({ label: moduleName(m), url: `${origin}/login?module=${m}` })),
    ...(hasSmallholder ? [{ label: 'Smallholder (members, forms, monitoring, carbon, EUDR)', url: `${origin}/login?module=smallholder-hub` }] : []),
  ];
  // Start the first monitoring run straight away (the backend queues a job).
  const [firstRun, setFirstRun] = useState({});
  const startFirstRuns = () => run(async () => {
    for (const s of done.schedulers) {
      const r = await runSchedulerJob(s.name);
      setFirstRun(f => ({ ...f, [s.name]: r?.job_id || 'started' }));
    }
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <p className="text-sm font-medium text-green-700">Setup</p>
          <h1 className="font-display text-3xl font-semibold text-gray-900 tracking-tight mt-1">Onboard an organisation</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">Everything the client will see comes from what you choose here: crops and services, estates and their blocks, logins and the monitoring schedule.</p>
        </div>
        {hasDraft && step < 6 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <span>Your answers are kept as a draft on this computer{done.org ? `, and ${company.company_name || 'the organisation'} is already created` : ''}. Boundary files need to be picked again after a refresh.</span>
            <button type="button" onClick={startOver} className="font-semibold text-red-700 hover:underline">Start over</button>
          </div>
        )}

        {/* Steps */}
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${i === step ? 'bg-green-700 border-green-700 text-white' : i < step ? 'bg-white border-green-600 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}>
                {i < step ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-semibold">{i + 1}</span>}
                <span className="font-semibold">{s}</span>
              </span>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
            </li>
          ))}
        </ol>

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {/* 1. Organisation */}
        {step === 0 && (
          <Card>
            <Field label="Organisation name"><input className={inputCls} placeholder="e.g. Okomu Oil Palm" value={company.company_name} onChange={e => setCompany(c => ({ ...c, company_name: e.target.value }))} autoFocus /></Field>
            <Advanced>
              <Field label="Short ID" hint={`Used in links and storage paths. Leave blank to use: ${slug || '—'}`} optional>
                <input className={inputCls} placeholder={slug || 'generated from the name'} value={company.schema_name} onChange={e => setCompany(c => ({ ...c, schema_name: e.target.value }))} />
                {slugErr && <span className="block text-xs text-red-700 mt-1">{slugErr}</span>}
              </Field>
            </Advanced>
            <div className="flex justify-end"><Primary disabled={!canNext[0]} onClick={() => setStep(1)}>Next: crops and services <ChevronRight size={15} /></Primary></div>
          </Card>
        )}

        {/* 2. Crops and services */}
        {step === 1 && (
          <Card>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Crops</h2>
              <p className="text-sm text-gray-500 -mt-1">Each crop chosen becomes a monitoring service on their hub. Choose at least one crop or one service below.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ALL_CROPS.map(c => (
                  <PhotoCard key={c} photo={CROP_PHOTOS[c]} title={CROP_LABELS[c]} on={crops.includes(c)} onClick={() => setCrops(l => toggleInList(l, c))} pages={CROP_PAGES} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Services</h2>
              <div className="flex flex-wrap gap-2">
                {SERVICE_PACKAGES.map(p => {
                  const on = p.services.every(s => services.includes(s));
                  return <Chip key={p.id} on={on} title={p.desc} onClick={() => setServices(l => on ? l.filter(s => !p.services.includes(s)) : [...new Set([...l, ...p.services])])}>{p.label}</Chip>;
                })}
              </div>
              {SERVICE_GROUPS.map(g => (
                <div key={g.id} className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500">{g.label}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {g.services.map(s => (
                      <PhotoCard key={s.id} photo={SERVICE_PHOTOS[s.id]} title={s.label} sub={s.desc} on={services.includes(s.id)} onClick={() => setServices(l => toggleInList(l, s.id))}
                        pages={SERVICE_CATALOG[s.id]?.sidebar.map(x => x.label)} />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500">Pages shown are the defaults for each crop and service. Switching pages on or off per organisation opens once the catalogue is connected.</p>
            </div>

            <Advanced title="Satellite layers this organisation may see (for agronomists)">
              <div className="flex flex-wrap gap-1.5">
                {ALL_RS_INDICES.map(ix => <Chip key={ix.id} on={allowedIndices.includes(ix.id)} onClick={() => setAllowedIndices(l => toggleInList(l, ix.id))}>{ix.label}</Chip>)}
              </div>
              <p className="text-xs text-gray-500">Leave all off to show every layer the crop uses.</p>
            </Advanced>

            <div className="flex justify-between">
              <Secondary onClick={() => setStep(0)}>Back</Secondary>
              <Primary disabled={!canNext[1]} onClick={() => setStep(2)}>Next: estates <ChevronRight size={15} /></Primary>
            </div>
          </Card>
        )}

        {/* 3. Estates */}
        {step === 2 && (
          <Card>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Estates</h2>
              <p className="text-sm text-gray-500 mt-1">Add every estate {company.company_name} wants monitored, each with its own boundary file. Estates can be in different places.</p>
            </div>

            {estates.map((e, i) => {
              const created = done.farms.some(f => f.farm_name === e.farm_name);
              return (
                <div key={e.key} className="rounded-2xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><MapPin size={16} className="text-green-700" /> Estate {i + 1}{created && <span className="text-xs font-semibold text-green-700">· created</span>}</div>
                    {estates.length > 1 && !created && <button type="button" onClick={() => setEstates(l => l.filter(x => x.key !== e.key))} className="p-2 text-gray-400 hover:text-red-600" aria-label="Remove estate"><Trash2 size={15} /></button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Estate name"><input className={inputCls} placeholder="e.g. Main estate" value={e.farm_name} onChange={ev => setEstate(e.key, { farm_name: ev.target.value })} /></Field>
                    {crops.length > 0 && (
                      <Field label="Crop grown here">
                        <select className={inputCls} value={e.crop || (crops.length === 1 ? crops[0] : '')} onChange={ev => setEstate(e.key, { crop: ev.target.value })}>
                          <option value="">Choose</option>
                          {crops.map(c => <option key={c} value={c}>{CROP_LABELS[c]}</option>)}
                        </select>
                      </Field>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer ${e.boundaryFile ? 'border-green-600 bg-green-50/40' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                      <UploadCloud size={24} className={e.boundaryFile ? 'text-green-700' : 'text-gray-400'} />
                      <span className="text-sm font-semibold text-gray-800 text-center">{e.boundaryFile ? e.boundaryFile.name : 'Choose the boundary file (.geojson)'}</span>
                      <span className="text-xs text-gray-500 text-center">The outline of the estate, with its blocks if you have them</span>
                      <input type="file" accept=".geojson,.json,application/geo+json" className="hidden" onChange={ev => onBoundary(e.key, ev.target.files?.[0] || null)} />
                    </label>
                    <div className="h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                      {e.geojson ? (
                        <MapContainer preferCanvas center={[6.43, 5.27]} zoom={11} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
                          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} />
                          <GeoJSON data={e.geojson} style={{ color: '#3F8432', weight: 2, fillColor: '#22c55e', fillOpacity: 0.2 }} />
                          <FitToBounds data={e.geojson} />
                        </MapContainer>
                      ) : <div className="h-full flex items-center justify-center text-xs text-gray-500">Map preview appears here</div>}
                    </div>
                  </div>
                  {e.boundaryError && <div className="text-sm text-red-700">{e.boundaryError}</div>}
                  {e.boundaryInfo && !e.boundaryError && <div className="text-xs text-gray-600">Boundary read: {e.boundaryInfo}</div>}
                  {estateErr(e) && <div className="text-sm text-red-700">{estateErr(e)}</div>}
                  <Toggle on={e.is_irrigated} label="Irrigated" sub="Adds irrigation pages and water-demand layers where the crop uses them." onChange={v => setEstate(e.key, { is_irrigated: v })} />
                  <Advanced title="Satellite processing (for agronomists)">
                    <Field label="Estate ID" optional hint={`Leave blank to use ${slug}_${slugify(e.farm_name) || '…'}`}><input className={inputCls} value={e.farm_id} onChange={ev => setEstate(e.key, { farm_id: ev.target.value })} /></Field>
                    <div className="space-y-1.5"><span className="text-sm font-semibold text-gray-800">Satellites</span><div className="flex flex-wrap gap-1.5">{SENSOR_OPTIONS.map(s => <Chip key={s} on={e.sensors.includes(s)} onClick={() => setEstate(e.key, { sensors: toggleInList(e.sensors, s) })}>{s}</Chip>)}</div></div>
                    <div className="space-y-1.5"><span className="text-sm font-semibold text-gray-800">Indices to compute</span><div className="flex flex-wrap gap-1.5">{ALL_INDICES.map(ix => <Chip key={ix} on={e.indices.includes(ix)} onClick={() => setEstate(e.key, { indices: toggleInList(e.indices, ix) })}>{ix}</Chip>)}</div></div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Detail"><select className={inputCls} value={e.processing_level} onChange={ev => setEstate(e.key, { processing_level: ev.target.value })}><option value="plot_level">Per block</option><option value="farm_level">Whole estate</option></select></Field>
                      <Field label="Maximum cloud cover (%)"><input type="number" min="0" max="100" className={inputCls} value={e.cloud_cover_threshold} onChange={ev => setEstate(e.key, { cloud_cover_threshold: parseInt(ev.target.value || '0', 10) })} /></Field>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-sm font-semibold text-gray-800">Past images to load</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[0, 1, 3, 6, 12].map(mo => {
                          const on = mo === 0 ? !e.start_date : e.start_date && Math.round((new Date(e.end_date) - new Date(e.start_date)) / 2.63e9) === mo;
                          return <Chip key={mo} on={on} onClick={() => {
                            if (mo === 0) return setEstate(e.key, { start_date: '', end_date: '' });
                            const end = new Date(), start = new Date(); start.setMonth(start.getMonth() - mo);
                            setEstate(e.key, { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) });
                          }}>{mo === 0 ? 'None, start today' : `${mo} month${mo > 1 ? 's' : ''}`}</Chip>;
                        })}
                      </div>
                    </div>
                  </Advanced>
                </div>
              );
            })}

            <Secondary onClick={() => setEstates(l => [...l, blankEstate()])}><Plus size={15} /> Add another estate</Secondary>

            {estates.length > 1 && (
              <div className="rounded-xl border border-gray-200 p-4 space-y-2">
                <Toggle on={grouped} label="These estates are next to each other: process them as one site" sub="Only for neighbouring estates (e.g. a main estate and its extensions). Estates in different places are processed separately." onChange={setGrouped} />
                {grouped && farApart > NEAR_KM && (
                  <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" /> These estates are about {Math.round(farApart)} km apart. Processing them as one site covers all the land between them; keep them separate unless they really are neighbours.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Secondary onClick={() => setStep(1)}>Back</Secondary>
              <Primary disabled={busy || !canNext[2]} onClick={submitEstates}>{busy ? 'Creating…' : `Create organisation and ${estates.length} estate${estates.length > 1 ? 's' : ''}`} <ChevronRight size={15} /></Primary>
            </div>
          </Card>
        )}

        {/* 4. Blocks and filters */}
        {step === 3 && (
          <Card>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Blocks and filters</h2>
              <p className="text-sm text-gray-500 mt-1">Tell us which columns of the boundary file name the blocks and estates. Client uploads, alerts and reports use them.</p>
            </div>
            {loadingProps && <p className="text-sm text-gray-500">Reading the boundary files…</p>}
            {!loadingProps && propOptions.length === 0 && <p className="text-sm text-gray-500">The boundary files have no named columns. Blocks will be numbered automatically.</p>}
            {!loadingProps && propOptions.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Block ID column" hint={propOptions.find(o => o.key === blockKey)?.sample_values?.length ? `e.g. ${propOptions.find(o => o.key === blockKey).sample_values.slice(0, 4).join(', ')}` : 'The ID the client uses for each block'}>
                    <select className={inputCls} value={blockKey} onChange={e => setBlockKey(e.target.value)}><option value="">None</option>{propOptions.map(o => <option key={o.key}>{o.key}</option>)}</select>
                  </Field>
                  <Field label="Estate column" optional hint="Only if one boundary file holds several estates">
                    <select className={inputCls} value={estateKey} onChange={e => setEstateKey(e.target.value)}><option value="">None</option>{propOptions.map(o => <option key={o.key}>{o.key}</option>)}</select>
                  </Field>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-gray-800">Dashboard filters <span className="font-normal text-gray-500">(up to 4)</span></span>
                  <div className="flex flex-wrap gap-1.5">
                    {propOptions.map(o => {
                      const on = filterKeys.includes(o.key), disabled = !on && filterKeys.length >= 4;
                      return <Chip key={o.key} on={on} disabled={disabled} title={o.sample_values?.slice(0, 3).join(', ')} onClick={() => setFilterKeys(k => on ? k.filter(x => x !== o.key) : [...k, o.key])}>{o.key}</Chip>;
                    })}
                  </div>
                </div>
              </>
            )}
            <Advanced title="Alert sensitivity">
              <p className="text-xs text-gray-500">Defaults suit most organisations. Change only if this one needs different sensitivity.</p>
              <div className="grid grid-cols-2 gap-4">
                {[['alert_ndvi_drop_pct', 'Vegetation drop that triggers an alert (0–1)'], ['alert_ndvi_health_critical', 'Vegetation level counted as critical'], ['alert_ndmi_water_stress_critical', 'Leaf water level counted as critical'], ['alert_smi_critical', 'Soil moisture level counted as critical']].map(([k, label]) => (
                  <Field key={k} label={label}><input type="number" step="0.01" className={inputCls} value={thresholds[k]} onChange={e => setThresholds(t => ({ ...t, [k]: parseFloat(e.target.value || '0') }))} /></Field>
                ))}
              </div>
              <Toggle on={ffill} label="Fill cloudy gaps in charts with the last clear reading" sub="Off by default; filled points are marked, not shown as new measurements." onChange={setFfill} />
            </Advanced>
            <div className="flex justify-end"><Primary disabled={busy} onClick={submitBlocks}>{busy ? 'Saving…' : 'Next: login'} <ChevronRight size={15} /></Primary></div>
          </Card>
        )}

        {/* 5. Login */}
        {step === 4 && (
          <Card>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Login for {company.company_name}</h2>
              <p className="text-sm text-gray-500 mt-1">The first account. More can be added later under Credentials.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name"><input className={inputCls} placeholder="Full name" value={cred.full_name} onChange={e => setCred(c => ({ ...c, full_name: e.target.value }))} /></Field>
              <Field label="Role"><select className={inputCls} value={cred.role} onChange={e => setCred(c => ({ ...c, role: e.target.value }))}><option value="admin">Admin: everything</option><option value="analyst">Analyst: monitoring and reports</option><option value="viewer">Viewer: read only</option></select></Field>
              <Field label="Email"><input className={inputCls} type="email" placeholder="name@company.com" value={cred.email} onChange={e => setCred(c => ({ ...c, email: e.target.value }))} />{emailErr && <span className="block text-xs text-red-700 mt-1">{emailErr}</span>}</Field>
              <Field label="Access code" optional hint="Leave blank to generate a strong one"><input className={inputCls} value={cred.access_code} onChange={e => setCred(c => ({ ...c, access_code: e.target.value }))} />{codeErr && <span className="block text-xs text-red-700 mt-1">{codeErr}</span>}</Field>
            </div>
            <div className="flex justify-end"><Primary disabled={busy || !canNext[4]} onClick={submitLogin}>{busy ? 'Creating…' : 'Next: schedule'} <ChevronRight size={15} /></Primary></div>
          </Card>
        )}

        {/* 6. Schedule */}
        {step === 5 && (
          <Card>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monitoring schedule</h2>
              <p className="text-sm text-gray-500 mt-1">How often new satellite images are processed {grouped ? 'for the combined site' : `for ${done.farms.length > 1 ? `each of the ${done.farms.length} estates` : 'the estate'}`}.</p>
            </div>
            <Toggle on={autoSchedule} label="Run automatically" sub="Off: the configuration is created and runs are started by hand." onChange={setAutoSchedule} />
            {autoSchedule && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[['days', 'Every few days'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['custom', 'Custom rule']].map(([id, label]) => <Chip key={id} on={sched.mode === id} onClick={() => setSched(s => (id === 'custom' && !s.custom ? { ...s, mode: id, custom: cronFor(s) } : { ...s, mode: id }))}>{label}</Chip>)}
                </div>
                {sched.mode === 'custom' ? <CustomRule value={sched.custom || ''} onChange={custom => setSched(s => ({ ...s, custom }))} /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sched.mode === 'days' && <Field label="Every how many days"><select className={inputCls} value={sched.every} onChange={e => setSched(s => ({ ...s, every: +e.target.value }))}>{[1, 2, 3, 5, 7, 10, 14].map(n => <option key={n} value={n}>{n === 1 ? 'Every day' : `Every ${n} days`}</option>)}</select></Field>}
                  {sched.mode === 'weekly' && <Field label="Day"><select className={inputCls} value={sched.weekday} onChange={e => setSched(s => ({ ...s, weekday: +e.target.value }))}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>}
                  {sched.mode === 'monthly' && <Field label="Day of the month"><select className={inputCls} value={sched.monthday} onChange={e => setSched(s => ({ ...s, monthday: +e.target.value }))}>{Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d}>{d}</option>)}</select></Field>}
                  <Field label="Time (server time)"><select className={inputCls} value={sched.hour} onChange={e => setSched(s => ({ ...s, hour: +e.target.value }))}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select></Field>
                </div>
                )}
                {sched.mode !== 'custom' && <p className="text-sm text-gray-700">Runs <span className="font-semibold">{scheduleText(sched)}</span>{!grouped && done.farms.length > 1 ? ', each estate 15 minutes after the previous one' : ''}.</p>}
              </div>
            )}
            <div className="flex justify-end"><Primary disabled={busy || (autoSchedule && sched.mode === 'custom' && Boolean(cronError(sched.custom)))} onClick={submitSchedule}>{busy ? 'Setting up…' : 'Finish setup'} <ChevronRight size={15} /></Primary></div>
          </Card>
        )}

        {/* 7. Finish */}
        {step === 6 && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700"><Check size={22} strokeWidth={2.5} /></div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{done.org?.display_name || company.company_name} is set up</h2>
                  <p className="text-sm text-gray-500">Dashboards fill with real data after the first monitoring run.</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  `${crops.length} crop monitoring service${crops.length !== 1 ? 's' : ''}${services.length ? ` and ${services.length} other service${services.length > 1 ? 's' : ''}` : ''}`,
                  `${done.farms.length} estate${done.farms.length !== 1 ? 's' : ''} with boundaries${grouped ? ', processed as one site' : ''}`,
                  blockKey ? `Blocks identified by "${blockKey}"${estateKey ? `, estates by "${estateKey}"` : ''}` : 'Blocks numbered automatically',
                  `Login: ${done.credential?.email || cred.email}${done.credential?.access_code ? ` · access code ${done.credential.access_code}` : ''}`,
                  done.schedulers.length ? `Monitoring runs ${scheduleText(sched)}` : 'No automatic schedule: start runs from the Scheduler page',
                ].map(t => <li key={t} className="flex items-start gap-2"><Check size={15} className="text-green-700 mt-0.5 shrink-0" />{t}</li>)}
              </ul>
            </Card>

            {done.schedulers.length > 0 && (
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">First monitoring run</h3>
                    <p className="text-sm text-gray-500 mt-1">Start it now instead of waiting for the schedule. Follow it on Pipeline runs; the client's maps and figures fill in when it finishes.</p>
                  </div>
                  {Object.keys(firstRun).length
                    ? <Link to="/admin/runs" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200">Started · view progress</Link>
                    : <Primary onClick={startFirstRuns} disabled={busy}>{busy ? 'Starting…' : 'Run now'}</Primary>}
                </div>
              </Card>
            )}

            <Card>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Next steps</h3>
                <p className="text-sm text-gray-500 mt-1">Set once by the FarmIntelytics team; the client never sees these settings.</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {crops.length > 0 && <li><Link to="/admin/thresholds" className="font-semibold text-green-700">Map classes</Link>: check the words, colours and advice for {crops.map(c => CROP_LABELS[c]).join(', ')} (platform defaults apply until changed).</li>}
                {hasSmallholder && <li>Smallholder: the co-operative designs its own registration form under Members and parcels; a starter form is offered there.</li>}
                <li><Link to="/admin/credentials" className="font-semibold text-green-700">Sign-in details</Link>: add more people from the organisation.</li>
                <li><Link to="/admin/runs" className="font-semibold text-green-700">Pipeline runs</Link>: follow every run for this organisation.</li>
              </ul>
            </Card>

            <Card>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Links to send the client</h3>
                <p className="text-sm text-gray-500 mt-1">Each opens that service&rsquo;s sign-in. Clients never see the internal hub.</p>
              </div>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
                {clientLinks.map(l => (
                  <div key={l.url} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0"><div className="text-sm font-semibold text-gray-900">{l.label}</div><div className="text-xs font-mono text-gray-500 truncate">{l.url}</div></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={l.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Open"><ExternalLink size={15} /></a>
                      <button onClick={() => copy(l.url)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Copy size={13} />{copied === l.url ? 'Copied' : 'Copy'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {datasetsAsked.length > 0 && (
              <Card>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Data the client will be asked for</h3>
                  <p className="text-sm text-gray-500 mt-1">Shown to them at sign-in until provided (Settings → Farm data).</p>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {datasetsAsked.map(d => (
                    <li key={d.id} className="rounded-xl border border-gray-200 p-3"><div className="text-sm font-semibold text-gray-900">{d.name}</div><div className="text-xs text-gray-500 mt-0.5">{d.why}</div></li>
                  ))}
                </ul>
              </Card>
            )}

            <Card>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden">{logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : <Building2 size={22} className="text-gray-400" />}</div>
                <div className="flex-1"><div className="text-sm font-semibold text-gray-900">Logo</div><div className="text-xs text-gray-500">Optional: shown on the hub and the client&rsquo;s sign-in.</div></div>
                <Secondary onClick={() => logoRef.current?.click()} disabled={logoBusy}>{logoBusy ? 'Uploading…' : logoUrl ? 'Replace' : 'Upload'}</Secondary>
                <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={onLogo} />
              </div>
              {done.configs.length > 0 && (
                <Advanced title="Technical details">
                  {done.configs.map(c => (
                    <div key={c.filename} className="space-y-1.5">
                      <div className="text-xs font-semibold text-gray-700">Pipeline configuration <span className="font-mono">{c.filename}</span></div>
                      {c.content && <pre className="text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-60">{c.content}</pre>}
                    </div>
                  ))}
                  {done.schedulers.map(s => <div key={s.name} className="text-xs text-gray-600">Schedule <span className="font-mono">{s.name}</span> · <span className="font-mono">{s.cron}</span></div>)}
                </Advanced>
              )}
            </Card>

            <div className="flex justify-end"><Primary onClick={restart}><Rocket size={15} /> Onboard another organisation</Primary></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
