import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck, Globe, Zap, CreditCard, 
  Landmark, Coins, Satellite, Users, Layers, UserCheck, Grid,
  Sprout, Wheat, Container, Leaf, Coffee, Activity, Droplets, Sparkles,
  TrendingUp, BarChart3
} from 'lucide-react';
import { login, fetchCropMonitoringConfig } from '../services/organizationMonitorApi';
import { HERO_PLACEHOLDERS } from '../constants/heroPlaceholders';

// ─── Crop & Subapp Design System Registry (Clean Light Theme) ────────────────
const CROP_DESIGNS = {
  oil_palm: {
    key: 'oil_palm',
    name: 'Oil Palm',
    branding: 'Oil Palm Monitoring',
    accentColor: '#16A34A', // Emerald Green
    lightBg: '#F0FDF4',
    badge: 'Oil Palm Estate Console',
    heroImage: '/crops/oil_palm.webp',
    title: <>Precision <span className="text-emerald-600 font-black">Oil Palm</span> Analytics</>,
    desc: 'Real-time satellite vegetation index, estate fresh fruit bunch yield modeling, and canopy health diagnostics.',
    features: [
      { icon: <Sprout size={20} />, title: 'Canopy Health & NDVI', desc: 'Real-time monitoring of frond vigor and nutrient status' },
      { icon: <Satellite size={20} />, title: 'Yield & FFB Forecasting', desc: 'Predictive tonnage modeling across estate blocks' },
      { icon: <ShieldCheck size={20} />, title: 'RSPO Compliance Ledger', desc: 'Deforestation verification and zero-burn audit trails' }
    ],
    stats: [
      { label: 'Avg NDVI Index', value: '0.84 Peak' },
      { label: 'Monitored Area', value: '68,500 Ha' },
      { label: 'Est. Tonnage', value: '22.8 MT/Ha' }
    ]
  },
  cashew: {
    key: 'cashew',
    name: 'Cashew',
    branding: 'Cashew Management',
    accentColor: '#D35400', // Terracotta / Amber
    lightBg: '#FFF7ED',
    badge: 'Cashew Orchard Console',
    heroImage: '/crops/cashew.webp',
    title: <>High-Precision <span className="text-amber-600 font-black">Cashew Orchard</span> Intel</>,
    desc: 'Tree count tracking, flowering stage canopy analysis, nut quality grading, and harvest scheduling.',
    features: [
      { icon: <Activity size={20} />, title: 'Canopy Gap Analysis', desc: 'Automated orchard tree counting and spacing density' },
      { icon: <Sparkles size={20} />, title: 'Flowering Stage Alert', desc: 'Canopy thermal monitoring for early pest detection' },
      { icon: <TrendingUp size={20} />, title: 'RCN Yield Prediction', desc: 'Outturn ratio forecasting and harvest planning' }
    ],
    stats: [
      { label: 'Outturn Rate', value: '49-52 lbs' },
      { label: 'Tree Density', value: '156 Trees/Ha' },
      { label: 'Orchard Vigor', value: '94.2% Optimal' }
    ]
  },
  sugarcane: {
    key: 'sugarcane',
    name: 'SugarCane',
    branding: 'Sugarcane Operations',
    accentColor: '#059669', // Emerald
    lightBg: '#ECFDF5',
    badge: 'Sugarcane Field Console',
    heroImage: '/crops/sugarcane.webp',
    title: <>Smart <span className="text-emerald-600 font-black">Sugarcane Field</span> Operations</>,
    desc: 'Biomass accumulation tracking, sucrose content estimation, and field productivity management.',
    features: [
      { icon: <Zap size={20} />, title: 'Biomass Estimation', desc: 'Satellite radar monitoring for sugar maturity tracking' },
      { icon: <BarChart3 size={20} />, title: 'Field Productivity', desc: 'Comprehensive yield and crop health performance' },
      { icon: <Leaf size={20} />, title: 'Ratoon Management', desc: 'Stubble vigor analysis across multi-cycle harvests' }
    ],
    stats: [
      { label: 'Est. Sucrose', value: '14.2% Brix' },
      { label: 'Field Biomass', value: '88 MT/Ha' },
      { label: 'Active Blocks', value: '100% Monitored' }
    ]
  },
  rice: {
    key: 'rice',
    name: 'Rice',
    branding: 'Rice Paddy Portal',
    accentColor: '#0D9488', // Teal
    lightBg: '#F0FDFA',
    badge: 'Rice Paddy Console',
    heroImage: '/crops/rice.webp',
    title: <>Multispectral <span className="text-teal-600 font-black">Rice Paddy</span> Monitoring</>,
    desc: 'Water level sensing, paddy growth phase mapping, nutrient zoning, and yield estimation.',
    features: [
      { icon: <Leaf size={20} />, title: 'Paddy Inundation Sensing', desc: 'Radar water level and soil moisture monitoring' },
      { icon: <Globe size={20} />, title: 'Growth Stage Tracker', desc: 'Tillering, panicle initiation & ripening stage detection' },
      { icon: <Sparkles size={20} />, title: 'Precision Fertilizer Zone', desc: 'Variable rate nutrient zoning derived from satellite imagery' }
    ],
    stats: [
      { label: 'Moisture Index', value: '89% Optimal' },
      { label: 'Growth Stage', value: 'Panicle Init.' },
      { label: 'Yield Est.', value: '6.4 MT/Ha' }
    ]
  },
  cocoa: {
    key: 'cocoa',
    name: 'Cocoa',
    branding: 'Cocoa Core Portal',
    accentColor: '#B45309', // Warm Bronze
    lightBg: '#FEF3C7',
    badge: 'Cocoa Harvest Console',
    heroImage: '/crops/cocoa.webp',
    title: <>Sustainable <span className="text-amber-700 font-black">Cocoa Harvest</span> Origin</>,
    desc: 'Shade-canopy density mapping, EUDR deforestation compliance verification, and bean traceability.',
    features: [
      { icon: <Coffee size={20} />, title: 'EUDR Compliance Audit', desc: 'Automated forest boundary verification for international standards' },
      { icon: <ShieldCheck size={20} />, title: 'Shade Canopy Index', desc: 'Agroforestry canopy density & carbon stock estimation' },
      { icon: <Users size={20} />, title: 'Farmer Traceability', desc: 'First-mile bag tagging and digital cooperative receipts' }
    ],
    stats: [
      { label: 'EUDR Verified', value: '100% Compliant' },
      { label: 'Shade Cover', value: '42% Agroforest' },
      { label: 'Bean Grade', value: 'Grade A Export' }
    ]
  },
  rubber: {
    key: 'rubber',
    name: 'Rubber',
    branding: 'Rubber Console',
    accentColor: '#0E7490', // Cyan Teal
    lightBg: '#ECFEFF',
    badge: 'Rubber Plantation Console',
    heroImage: '/crops/rubber.webp',
    title: <>High-Yield <span className="text-cyan-700 font-black">Rubber & Latex</span> Monitoring</>,
    desc: 'Latex dry rubber content analytics, tapping cycle optimization, and estate productivity logs.',
    features: [
      { icon: <Droplets size={20} />, title: 'Latex DRC Analytics', desc: 'Lab & field latex solids percentage tracking' },
      { icon: <BarChart3 size={20} />, title: 'Wintering Defoliation Map', desc: 'Satellite tracking of leaf drop and tapping rest cycles' },
      { icon: <UserCheck size={20} />, title: 'Tagger Productivity', desc: 'Daily cup collection logs and tree tapping assignments' }
    ],
    stats: [
      { label: 'Dry Rubber %', value: '34.8% DRC' },
      { label: 'Tapping Status', value: 'Active Cycle' },
      { label: 'Daily Latex', value: '1,420 L/Block' }
    ]
  },
  cassava: {
    key: 'cassava',
    name: 'Cassava',
    branding: 'Cassava Hub',
    accentColor: '#D97706', // Amber Gold
    lightBg: '#FFFBEB',
    badge: 'Cassava Tuber Console',
    heroImage: '/crops/cassava.webp',
    title: <>Advanced <span className="text-amber-600 font-black">Cassava Tuber</span> Analytics</>,
    desc: 'Underground tuber growth modeling, canopy stress detection, starch yield prediction, and harvest scheduling.',
    features: [
      { icon: <Container size={20} />, title: 'Tuber Growth Modeling', desc: 'Root biomass growth curves based on soil sensors' },
      { icon: <Sparkles size={20} />, title: 'Canopy Stress Detection', desc: 'Multispectral leaf health & chlorosis mapping' },
      { icon: <TrendingUp size={20} />, title: 'Processing Supply Chain', desc: 'Harvest age tracking for maximum starch content' }
    ],
    stats: [
      { label: 'Starch Yield', value: '26.4% Content' },
      { label: 'Tuber Weight', value: '28.5 MT/Ha' },
      { label: 'Health Score', value: '98% Disease-Free' }
    ]
  },
  maize: {
    key: 'maize',
    name: 'Maize',
    branding: 'Maize Console',
    accentColor: '#CA8A04', // Sunburst Yellow
    lightBg: '#FEF9C3',
    badge: 'Maize Field Console',
    heroImage: '/crops/maize.webp',
    title: <>Precision <span className="text-yellow-600 font-black">Maize Crop</span> Intelligence</>,
    desc: 'Hybrid seed variety performance tracking, pest infestation mapping, moisture stress alerts, and yield forecasts.',
    features: [
      { icon: <Wheat size={20} />, title: 'Pest Risk Radar', desc: 'Early warning leaf damage alerts from spectral imagery' },
      { icon: <Globe size={20} />, title: 'Variety Comparison', desc: 'Side-by-side vigor analysis for commercial maize hybrids' },
      { icon: <Zap size={20} />, title: 'Grain Moisture Prediction', desc: 'Dry-down monitoring for optimal combine harvesting' }
    ],
    stats: [
      { label: 'Grain Moisture', value: '14.1% Ideal' },
      { label: 'Hybrid Vigor', value: 'High Index' },
      { label: 'Est. Harvest', value: '9.2 MT/Ha' }
    ]
  },
  organization: {
    key: 'organization',
    name: 'Organization Monitoring',
    branding: 'Organization Monitoring',
    accentColor: '#16A34A', // Emerald Green
    lightBg: '#F0FDF4',
    badge: 'Organization Command Console',
    heroImage: '/crops/oil_palm.webp',
    title: <>Precision <span className="text-emerald-600 font-black">Agricultural Organization</span> Console</>,
    desc: 'Central command console for corporate agricultural organizations, managing multi-tenant farm portfolios, aggregated satellite coverage, and user roles.',
    features: [
      { icon: <Globe size={20} />, title: 'Multi-Tenant Farm Portfolio', desc: 'Unified monitoring across regional subsidiaries & estates' },
      { icon: <ShieldCheck size={20} />, title: 'Role & License Management', desc: 'Fine-grained access control for agronomy & executive teams' },
      { icon: <Layers size={20} />, title: 'Aggregated Analytics', desc: 'Cross-crop performance dashboards and sustainability reporting' }
    ],
    stats: [
      { label: 'Active Farms', value: '142 Estates' },
      { label: 'Total Area', value: '310,000 Ha' },
      { label: 'Uptime SLA', value: '99.99% Enterprise' }
    ]
  },
  finance: {
    key: 'finance',
    name: 'Central Finance',
    branding: 'Central Finance Hub',
    accentColor: '#059669', // Emerald Finance
    lightBg: '#ECFDF5',
    badge: 'Finance · Central ledger',
    heroImage: '/crops/hero/finance.webp',
    title: <>Farm production and payments, <span className="text-emerald-500 font-black">one ledger</span></>,
    desc: 'Production signals per block next to the deliveries and payments recorded for each farmer.',
    features: [
      { icon: <Landmark size={20} />, title: 'Multi-Bank Settlement', desc: 'Instant automated worker & farmer payroll disbursements' },
      { icon: <ShieldCheck size={20} />, title: 'Immutable Audit Ledger', desc: 'Verified transaction logs and balance sheets' },
      { icon: <Coins size={20} />, title: 'Automated Reconciliation', desc: 'Real-time match between field logs & bank payouts' }
    ],
    stats: [
      { label: 'Disbursed', value: '$4.2M MTD' },
      { label: 'Settlement Speed', value: '< 2 Seconds' },
      { label: 'Audit Accuracy', value: '100% Reconciled' }
    ]
  },
  // ─── Sustainability, field advisory and finance services ───
  estate_carbon: {
    key: 'estate_carbon',
    name: 'Estate Carbon',
    branding: 'Estate Carbon',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Sustainability · Estate carbon',
    heroImage: '/crops/hero/estate_carbon.webp',
    title: <>Carbon on your <span className="text-emerald-500 font-black">estate</span>, tracked from space</>,
    desc: 'Biomass, land-use change and carbon signals for every block of the estate, ready for carbon reporting.',
    features: [],
    stats: []
  },
  group_carbon: {
    key: 'group_carbon',
    name: 'Group Carbon',
    branding: 'Group Carbon',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Sustainability · Group carbon',
    heroImage: '/crops/hero/group_carbon.webp',
    title: <>Carbon for <span className="text-emerald-500 font-black">smallholder groups</span></>,
    desc: 'Member plots, tree cover and land-use change for each cooperative or community group.',
    features: [],
    stats: []
  },
  forestry: {
    key: 'forestry',
    name: 'Forestry Intelligence',
    branding: 'Forestry Intelligence',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Sustainability · Forestry',
    heroImage: '/crops/hero/forestry.webp',
    title: <>Know your <span className="text-emerald-500 font-black">forest</span>, every season</>,
    desc: 'Canopy condition, moisture and forest-cover change from optical and radar satellites.',
    features: [],
    stats: []
  },
  estimator: {
    key: 'estimator',
    name: 'Carbon Estimator',
    branding: 'Carbon Estimator',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Sustainability · Carbon estimator',
    heroImage: '/crops/hero/estimator.webp',
    title: <>Estimate <span className="text-emerald-500 font-black">carbon</span> before you commit</>,
    desc: 'Vegetation and land-cover inputs for a site, with carbon estimates and scenarios.',
    features: [],
    stats: []
  },
  restoration: {
    key: 'restoration',
    name: 'Land Restoration',
    branding: 'Land Restoration',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Sustainability · Land restoration',
    heroImage: '/crops/hero/restoration.webp',
    title: <>Watch degraded land <span className="text-emerald-500 font-black">recover</span></>,
    desc: 'Restoration zones, vegetation recovery and moisture over time, site by site.',
    features: [],
    stats: []
  },
  eudr: {
    key: 'eudr',
    name: 'EUDR Check',
    branding: 'EUDR Check',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Sustainability · EUDR',
    heroImage: '/crops/hero/eudr.webp',
    title: <>Deforestation-free <span className="text-emerald-500 font-black">evidence</span> for EU buyers</>,
    desc: 'Plot geolocation and forest-cover change since the 31 December 2020 cut-off, for oil palm, cocoa and rubber.',
    features: [],
    stats: []
  },
  field_logs: {
    key: 'field_logs',
    name: 'Field Logs',
    branding: 'Field Logs',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Field advisory · Field logs',
    heroImage: '/crops/hero/field_logs.webp',
    title: <>Every field <span className="text-emerald-500 font-black">operation</span>, on the map</>,
    desc: 'Field condition from satellite next to the harvesting, planting, spraying and scouting recorded for each block.',
    features: [],
    stats: []
  },
  advisor: {
    key: 'advisor',
    name: 'Farm Advisor',
    branding: 'Farm Advisor',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    badge: 'Field advisory · Farm advisor',
    heroImage: '/crops/hero/advisor.webp',
    title: <>Advice for <span className="text-emerald-500 font-black">every field</span></>,
    desc: 'Crop condition, water and weather turned into plain advice for each field.',
    features: [],
    stats: []
  },
  drone: {
    key: 'drone',
    name: 'Drone Intelligence',
    branding: 'Drone Aerial Intelligence',
    accentColor: '#0284C7', // Sky Blue
    lightBg: '#F0F9FF',
    badge: 'Drone Aerial Console',
    heroImage: '/crops/drone.webp',
    title: <>High-Resolution <span className="text-sky-600 font-black">Drone Aerial</span> Intel</>,
    desc: 'High-resolution drone flight surveys, canopy gap mapping, tree counts, and field inspection telemetry.',
    features: [],
    stats: []
  },
  smallholder: {
    key: 'smallholder',
    name: 'Smallholder Cooperative',
    branding: 'Smallholder Cooperative Portal',
    accentColor: '#16A34A', // Emerald
    lightBg: '#F0FDF4',
    badge: 'Farmer Cooperative Console',
    heroImage: '/crops/smallholder.webp',
    title: <>Empowering <span className="text-emerald-600 font-black">Smallholder Farmer</span> Communities</>,
    desc: 'Unified farmer profiling, multi-crop parcel tracking, cooperative registry, and group compliance auditing.',
    features: [],
    stats: []
  }
};

// ─── Helper function to match module name to crop design ─────────────────────
function resolveCropDesign(moduleName) {
  if (!moduleName) return CROP_DESIGNS.oil_palm;
  const lower = moduleName.toLowerCase();

  // Services first: their names contain crop/group words ("Group Carbon").
  if (lower.includes('estate carbon')) return CROP_DESIGNS.estate_carbon;
  if (lower.includes('group carbon')) return CROP_DESIGNS.group_carbon;
  if (lower.includes('forestry')) return CROP_DESIGNS.forestry;
  if (lower.includes('carbon estimator')) return CROP_DESIGNS.estimator;
  if (lower.includes('restoration')) return CROP_DESIGNS.restoration;
  if (lower.includes('eudr')) return CROP_DESIGNS.eudr;
  if (lower.includes('field logs')) return CROP_DESIGNS.field_logs;
  if (lower.includes('advisor')) return CROP_DESIGNS.advisor;
  if (lower.includes('ledger') || lower.includes('finance')) return CROP_DESIGNS.finance;
  if (lower.includes('oil palm') || lower.includes('ffb') || lower.includes('rs-ffb')) return CROP_DESIGNS.oil_palm;
  if (lower.includes('cashew')) return CROP_DESIGNS.cashew;
  if (lower.includes('sugarcane') || lower.includes('cane')) return CROP_DESIGNS.sugarcane;
  if (lower.includes('rice') || lower.includes('paddy')) return CROP_DESIGNS.rice;
  if (lower.includes('cocoa')) return CROP_DESIGNS.cocoa;
  if (lower.includes('rubber') || lower.includes('latex')) return CROP_DESIGNS.rubber;
  if (lower.includes('cassava') || lower.includes('tuber')) return CROP_DESIGNS.cassava;
  if (lower.includes('maize') || lower.includes('corn')) return CROP_DESIGNS.maize;
  if (lower.includes('drone')) return CROP_DESIGNS.drone;
  if (lower.includes('smallholder') || lower.includes('cooperative') || lower.includes('group')) return CROP_DESIGNS.smallholder;
  if (lower.includes('organization') || lower.includes('organion') || lower.includes('olam') || lower.includes('okomu') || lower.includes('agromonitor')) return CROP_DESIGNS.organization;
  if (lower.includes('finance') || lower.includes('ledger') || lower.includes('payment')) return CROP_DESIGNS.finance;

  return CROP_DESIGNS.oil_palm; // fallback
}

// ─── Main Login Component (Clean White Background Theme) ─────────────────────
const Login = ({ onLogin, moduleName, onBack, defaultEmail = '', defaultCode = '' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [accessCode, setAccessCode] = useState(defaultCode);
  const [error, setError] = useState('');
  const [heroLoaded, setHeroLoaded] = useState(false);

  const currentDesign = resolveCropDesign(moduleName);

  useEffect(() => {
    setEmail(defaultEmail);
    setAccessCode(defaultCode);
  }, [defaultEmail, defaultCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(email, accessCode);
      if (response.status === 'success' && response.token && response.tenant) {
        localStorage.setItem('fi_token', response.token);
        localStorage.setItem('fi_email', response.email);
        localStorage.setItem('fi_tenant', response.tenant);
        localStorage.setItem('fi_role', response.role || 'admin');
        if (response.full_name) localStorage.setItem('fi_full_name', response.full_name);
        else localStorage.removeItem('fi_full_name');
        
        try {
          const config = await fetchCropMonitoringConfig();
          if (config?.display_name) localStorage.setItem('fi_display_name', config.display_name);
          if (Array.isArray(config?.modules)) localStorage.setItem('fi_allowed_modules', JSON.stringify(config.modules));
          if (Array.isArray(config?.allowed_crops)) localStorage.setItem('fi_allowed_crops', JSON.stringify(config.allowed_crops));
          if (Array.isArray(config?.map_center)) localStorage.setItem('fi_map_center', JSON.stringify(config.map_center));
        } catch (_) {
          localStorage.removeItem('fi_display_name');
          localStorage.removeItem('fi_allowed_modules');
          localStorage.removeItem('fi_allowed_crops');
          localStorage.removeItem('fi_map_center');
        }
        onLogin();
      } else {
        setError(response.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Server connection failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (emailToSet = 'demo@farmintelytics.com', codeToSet = '***REMOVED***') => {
    setEmail(emailToSet);
    setAccessCode(codeToSet);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-[var(--text-main)] font-sans">

      {/* ── Left: crop photograph, full height, caption on a soft gradient ── */}
      <aside
        className="relative lg:w-1/2 min-h-[260px] lg:min-h-screen overflow-hidden bg-slate-100 bg-cover bg-center"
        // Blurred ~0.5 KB preview shows instantly; the full photo fades in over it.
        style={{ backgroundImage: HERO_PLACEHOLDERS[currentDesign.heroImage] ? `url(${HERO_PLACEHOLDERS[currentDesign.heroImage]})` : undefined }}
      >
        <img
          src={currentDesign.heroImage}
          alt={currentDesign.name}
          className={`absolute inset-0 w-full h-full object-cover object-center saturate-[0.85] transition-opacity duration-500 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
          fetchpriority="high"
          onLoad={() => setHeroLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-8 lg:p-14 text-white">
          <span className="self-start mb-4 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-medium">
            {currentDesign.badge}
          </span>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold leading-tight max-w-lg">
            {currentDesign.title}
          </h1>
          <p className="mt-3 text-sm lg:text-base text-white/85 leading-relaxed max-w-lg">
            {currentDesign.desc}
          </p>
        </div>
      </aside>

      {/* ── Right: sign-in ─────────────────────────────────────────────────── */}
      <main className="lg:w-1/2 flex flex-col px-6 sm:px-12 lg:px-16 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/farmintelytics-logo.png" alt="FarmIntelytics" className="h-9 w-9 object-contain" width="36" height="36" />
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">FarmIntelytics</p>
              <p className="text-xs text-[var(--text-muted)]">{currentDesign.branding}</p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-[var(--border-light)] text-sm font-medium hover:bg-[var(--bg-main)] transition-colors"
            >
              <Grid size={15} /> <span className="hidden sm:inline">Back to</span> hub
            </button>
          )}
        </header>

        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--border-light)] p-8 sm:p-10">
            <p className="text-sm font-medium text-[var(--brand-primary)]">Authorised portal</p>
            <h2 className="font-display text-3xl font-semibold mt-1">Sign in</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
              Use your organisation credentials to open the <span className="font-medium text-[var(--text-main)]">{currentDesign.name}</span> console.
            </p>

            {error && (
              <div className="mt-6 p-3.5 rounded-[10px] border border-red-200 bg-red-50 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@organisation.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-[10px] border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Access code</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    className="w-full rounded-[10px] border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Hide access code' : 'Show access code'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Demo quick-fill (demo server only) */}
            <div className="mt-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Demo:</span>
              <button type="button" onClick={() => handleFillDemo('demo@farmintelytics.com', '***REMOVED***')}
                className="px-2.5 py-1 rounded-md border border-[var(--border-light)] hover:bg-[var(--bg-main)] text-[var(--text-main)]">Okomu</button>
              <button type="button" onClick={() => handleFillDemo('olam@farmintelytics.com', '***REMOVED***')}
                className="px-2.5 py-1 rounded-md border border-[var(--border-light)] hover:bg-[var(--bg-main)] text-[var(--text-main)]">Olam</button>
            </div>
          </div>
        </div>

        <footer className="text-xs text-slate-400">© {new Date().getFullYear()} FarmIntelytics</footer>
      </main>
    </div>
  );
};

export default Login;

