import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck, Globe, Zap, CreditCard, 
  Landmark, Coins, Satellite, Users, Layers, UserCheck, Grid,
  Sprout, Wheat, Container, Leaf, Coffee, Activity, Droplets, Sparkles,
  TrendingUp, BarChart3
} from 'lucide-react';
import { login, fetchCropMonitoringConfig } from '../services/organizationMonitorApi';

// ─── Crop & Subapp Design System Registry (Clean Light Theme) ────────────────
const CROP_DESIGNS = {
  oil_palm: {
    key: 'oil_palm',
    name: 'Oil Palm',
    branding: 'Oil Palm Monitoring',
    accentColor: '#16A34A', // Emerald Green
    lightBg: '#F0FDF4',
    badge: 'Oil Palm Estate Console',
    heroImage: '/crops/oil_palm.png',
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
    heroImage: '/crops/cashew.png',
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
    heroImage: '/crops/sugarcane.png',
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
    heroImage: '/crops/rice.png',
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
    heroImage: '/crops/cocoa.png',
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
    heroImage: '/crops/rubber.png',
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
    heroImage: '/crops/cassava.png',
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
    heroImage: '/crops/maize.png',
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
    heroImage: '/crops/oil_palm.png',
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
    badge: 'Financial Ledger Console',
    heroImage: '/crops/organization.png',
    title: <>Automating <span className="text-emerald-600 font-black">Enterprise Liquidity</span></>,
    desc: 'Direct disbursement, immutable financial reconciliation, worker payroll, and supplier ledger integration.',
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
  drone: {
    key: 'drone',
    name: 'Drone Intelligence',
    branding: 'Drone Aerial Intelligence',
    accentColor: '#0284C7', // Sky Blue
    lightBg: '#F0F9FF',
    badge: 'Drone Aerial Console',
    heroImage: '/crops/drone.png',
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
    heroImage: '/crops/smallholder.png',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* ── Top Header Bar ────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-slate-300 bg-white">
        <div className="flex items-center gap-4">
          <img src="/farmintelytics-logo.png" alt="FarmIntelytics" className="h-11 w-auto object-contain" />
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-slate-900 leading-none">FarmIntelytics</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-800 mt-1">
              {currentDesign.branding}
            </p>
          </div>
        </div>

        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-slate-300"
          >
            <Grid size={15} /> <span className="hidden sm:inline">Back to</span> Hub
          </button>
        )}
      </header>

      {/* ── Main Split View ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row relative z-10 p-6 lg:p-12 gap-8 items-stretch">
        
        {/* Left Side: Crop-Specific Pure Natural Photography & Card ─────────── */}
        <div className="lg:w-7/12 relative min-h-[440px] lg:min-h-full flex flex-col justify-end p-8 sm:p-12 rounded-[2rem] overflow-hidden border border-slate-300 bg-slate-100">
          
          {/* Background Natural Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={currentDesign.heroImage} 
              alt={currentDesign.name}
              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
            {/* Soft Dark Gradient for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
          </div>

          {/* Floating Solid Content Overlay */}
          <div className="relative z-10 max-w-xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-lg">
            
            {/* Crop Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span 
                className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border border-slate-200"
                style={{ 
                  backgroundColor: currentDesign.lightBg,
                  color: currentDesign.accentColor
                }}
              >
                {currentDesign.badge}
              </span>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                Precision Agriculture Console
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight mb-3">
              {currentDesign.title}
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-900 font-bold leading-relaxed">
              {currentDesign.desc}
            </p>

          </div>
        </div>

        {/* Right Side: Clean White Sign-In Form ────────────────────────────── */}
        <div className="lg:w-5/12 flex items-center justify-center p-6 sm:p-12 bg-white rounded-[2rem] border border-slate-300 shadow-md">
          <div className="w-full max-w-md">

            <div className="mb-8">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-700">Authorized Portal</span>
              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mt-1">Sign In</h2>
              <p className="text-xs text-slate-800 font-bold mt-2">
                Enter your identity credentials to access <span className="font-black text-slate-900">{currentDesign.name}</span> operations.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-900 rounded-2xl text-xs font-black flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-900 px-1">
                  Email Identity
                </label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-slate-900 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="admin@farmintelytics.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-black text-slate-900 outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-900 px-1">
                  Access Code
                </label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-slate-900 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-black text-slate-900 outline-none transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Quick Fill Demo Helpers */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => handleFillDemo('demo@farmintelytics.com', '***REMOVED***')}
                  className="text-[11px] font-black text-emerald-700 hover:text-emerald-900 underline underline-offset-4 transition-colors"
                >
                  Use Demo Tenant (Okomu)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('olam@farmintelytics.com', '***REMOVED***')}
                  className="text-[11px] font-black text-slate-700 hover:text-slate-900 underline underline-offset-4 transition-colors"
                >
                  Use Demo Tenant (Olam)
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                style={{ 
                  backgroundColor: currentDesign.accentColor
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter {currentDesign.name} Console</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-6 border-t border-slate-100 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Powered by FarmIntelytics Systems
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Login;

