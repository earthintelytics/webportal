import React from 'react';
import { 
  ArrowRight, 
  Globe, 
  Activity, 
  CreditCard, 
  ClipboardList, 
  MessageSquare, 
  Leaf, 
  Satellite,
  ChevronDown,
  Trees
} from 'lucide-react';
import { 
  OilPalmIcon, 
  RubberIcon, 
  SugarcaneIcon, 
  CashewIcon, 
  CocoaIcon, 
  CassavaIcon, 
  MaizeIcon, 
  RiceIcon, 
  DroneIcon, 
  SmallholderIcon 
} from '../components/CropIcons';
import { fetchTenants, fetchCropMonitoringConfig } from '../services/organizationMonitorApi';

const ModuleCard = ({ title, crop, id, icon, active, onSelect, logoUrl }) => {
  return (
    <button
      onClick={() => active && onSelect(id)}
      className={`group relative p-8 rounded-2xl transition-all duration-300 flex flex-col text-left border border-slate-200 shadow-sm ${
        active
          ? 'bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
          : 'bg-white opacity-40 cursor-not-allowed'
      }`}
    >
      <div className={`p-4 rounded-xl w-fit mb-6 bg-white border border-slate-200 shadow-sm transition-all overflow-hidden flex items-center justify-center ${
        active ? 'text-slate-800 group-hover:text-emerald-700 group-hover:border-slate-400' : 'text-slate-400'
      }`}>
        {logoUrl ? <img src={logoUrl} alt="" className="w-8 h-8 object-contain" /> : React.cloneElement(icon, { size: 30, strokeWidth: 1.75 })}
      </div>
      
      <div className="flex-1">
        <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-2 ${active ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{crop}</span>
        </div>
        <h3 className={`text-xl font-black tracking-tight leading-tight ${active ? 'text-slate-900' : 'text-slate-500'}`}>
          {title}
        </h3>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-500'}`}>
          {active ? 'Launch Portal' : 'Locked'}
        </span>
        {active && <ArrowRight size={18} className="text-slate-400 group-hover:text-slate-900 transform group-hover:translate-x-2 transition-all" />}
      </div>
    </button>
  );
};

const PortalHub = ({ onSelectModule }) => {
  const [activeTab, setActiveTab] = React.useState('monitoring');
  const [customModules, setCustomModules] = React.useState([
    { id: 'custom-agromonitor-olam', title: 'Olam Agro Monitoring', crop: 'Olam', icon: <Satellite />, active: true },
    { id: 'custom-agromonitor-okomu', title: 'Okomu Agro Monitoring', crop: 'Okomu', icon: <Satellite />, active: true },
  ]);

  // Load tenant list for the Organization section (dynamic agro-monitoring cards)
  React.useEffect(() => {
    async function loadTenants() {
      try {
        const tenants = await fetchTenants();
        if (tenants && Array.isArray(tenants)) {
          const mapped = tenants.map(t => ({
            id: t.id,
            title: t.title,
            crop: t.crop,
            icon: <Satellite />,
            active: t.active,
            logoUrl: t.logo_url || ''
          }));
          setCustomModules(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch tenants, using static fallback:", err);
      }
    }
    loadTenants();
  }, []);

  // Before login every card is shown. After login, the organisation's allowed
  // modules (TenantConfig.allowed_modules, set in the admin portal and stored
  // at login as fi_allowed_modules) decide which cards appear, so a tenant
  // never opens a module that would only answer "Not enabled".
  const allowedModules = React.useMemo(() => {
    try {
      if (!localStorage.getItem('fi_token')) return null;
      const list = JSON.parse(localStorage.getItem('fi_allowed_modules') || 'null');
      return Array.isArray(list) && list.length > 0 ? new Set(list) : null;
    } catch {
      return null;
    }
  }, []);
  const filterModules = (modules) => modules
    .filter(m => !allowedModules || allowedModules.has(m.id))
    .map(m => ({ ...m, active: m.active !== false }));

  const sections = [
    {
      id: 'management',
      title: 'Management Solutions',
      description: 'Workforce logistics, biometrics, and smallholder group planning for large-scale estate and cooperative operations.',
      modules: filterModules([
        { id: 'management-ffb',       title: 'FFB Intelligence',  crop: 'Oil Palm',    icon: <OilPalmIcon />,     active: true },
        { id: 'management-maize',     title: 'Maize Hub',         crop: 'Maize',       icon: <MaizeIcon />,       active: true },
        { id: 'management-cassava',   title: 'Cassava Core',      crop: 'Cassava',     icon: <CassavaIcon />,     active: true },
        { id: 'management-rice',      title: 'Rice Monitor',      crop: 'Rice',        icon: <RiceIcon />,        active: true },
        { id: 'management-cocoa',     title: 'Cocoa Core',        crop: 'Cocoa',       icon: <CocoaIcon />,       active: true },
        { id: 'management-sugarcane', title: 'Cane Console',      crop: 'SugarCane',   icon: <SugarcaneIcon />,   active: true },
        { id: 'management-cashew',    title: 'Cashew Hub',        crop: 'Cashew',      icon: <CashewIcon />,      active: true },
        { id: 'management-rubber',    title: 'Rubber Hub',        crop: 'Rubber',      icon: <RubberIcon />,      active: true },
        { id: 'group-management',     title: 'Groups Hub',        crop: 'Smallholder', icon: <SmallholderIcon />, active: true },
      ])
    },
    {
      id: 'monitoring',
      title: 'Geospatial Intelligence',
      description: 'Multispectral satellite imagery and drone-level field surveillance for high-precision monitoring.',
      modules: filterModules([
        { id: 'rs-ffb',       title: 'Oil Palm',    crop: 'Oil Palm',    icon: <OilPalmIcon />,     active: true },
        { id: 'rs-maize',     title: 'Maize Hub',   crop: 'Maize',       icon: <MaizeIcon />,       active: true },
        { id: 'rs-cassava',   title: 'Cassava',     crop: 'Cassava',     icon: <CassavaIcon />,     active: true },
        { id: 'rs-rice',      title: 'Rice Monitor',crop: 'Rice',        icon: <RiceIcon />,        active: true },
        { id: 'rs-cocoa',     title: 'Cocoa Core',  crop: 'Cocoa',       icon: <CocoaIcon />,       active: true },
        { id: 'rs-sugarcane', title: 'SugarCane',   crop: 'SugarCane',   icon: <SugarcaneIcon />,   active: true },
        { id: 'rs-cashew',    title: 'Cashew',      crop: 'Cashew',      icon: <CashewIcon />,      active: true },
        { id: 'rs-rubber',    title: 'Rubber',      crop: 'Rubber',      icon: <RubberIcon />,      active: true },
        { id: 'rs-drone',     title: 'Drone Intel', crop: 'Aerial',      icon: <DroneIcon />,       active: true },
        { id: 'group-monitoring', title: 'Smallholder', crop: 'Fusion',  icon: <SmallholderIcon />, active: true },
      ])
    },
    {
      id: 'sustainability',
      title: 'Sustainability & Carbon',
      description: 'Carbon sequestration monitoring, forestry biomass estimation, and smallholder group carbon verification.',
      modules: filterModules([
        { id: 'carbon-ffb',       title: 'Estate Carbon', crop: 'Industrial', icon: <Leaf />, active: true  },
        { id: 'carbon-groups',    title: 'Group Carbon',  crop: 'Smallholder', icon: <Globe />, active: true  },
        { id: 'forestry-intel',   title: 'Forestry Intel', crop: 'High Density', icon: <Trees />, active: true  },
        { id: 'carbon-estimator', title: 'Carbon Est.',   crop: 'Analytical', icon: <Activity />, active: true  },
      ])
    },
    {
      id: 'payments',
      title: 'Finance & Ledger',
      description: 'Immutable farm ledgers and secure multi-crop disbursement systems.',
      modules: filterModules([
        { id: 'finance-hub', title: 'Central Ledger', crop: 'Multi-Crop', icon: <CreditCard />, active: true  },
      ])
    },
    {
      id: 'field-advisory',
      title: 'Field Advisory',
      description: 'Geo-referenced field logs and location-aware agronomic insights.',
      modules: filterModules([
        { id: 'activity-ffb', title: 'Field Logs',    crop: 'Operations', icon: <ClipboardList />, active: true  },
        { id: 'advisor',      title: 'Farm Advisor',    crop: 'Agronomy',   icon: <MessageSquare />, active: true  },
      ])
    },
    {
      id: 'custom',
      title: 'Custom Solutions',
      description: 'Bespoke operational gateways and proprietary analytics models tailored for specific agri-businesses.',
      modules: filterModules(customModules),
    },
  ];

  // Only live tabs, and only those with at least one card for this user.
  const visibleTabs = [
    { id: 'monitoring', label: 'Crop Monitoring' },
    { id: 'custom', label: 'Organization' },
  ].filter(tab => (sections.find(s => s.id === tab.id)?.modules.length ?? 0) > 0);
  const currentTabId = visibleTabs.some(t => t.id === activeTab) ? activeTab : visibleTabs[0]?.id;
  const currentSection = sections.find(s => s.id === currentTabId) || sections[0];

  return (
    <div className="min-h-screen bg-gray-50 p-8 lg:p-20 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-20">
          <div className="flex items-center gap-5">
             <div className="h-20 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <img src="/farmintelytics-logo.png" alt="Logo" className="h-full w-auto object-contain" />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-gray-900 leading-none">FarmIntelytics</h1>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-green-600 mt-1.5">Verified · Monitored · Connected</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                <ChevronDown size={18} className="animate-bounce" />
             </div>
          </div>
        </header>

        <div className="mb-24">
           <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-8">
             Operational <br />
             <span className="text-green-600">Intelligence Hub.</span>
           </h2>
           <p className="text-lg text-slate-800 font-bold max-w-3xl leading-relaxed">
             A unified enterprise gateway for large-scale agricultural management. Orchestrate your entire multi-crop operation from real-time monitoring to automated logistics.
           </p>
        </div>

        <div className="flex flex-wrap items-center gap-12 mb-10 border-b border-slate-200">
          {/* Management, Sustainability, Finance, and Field Advisory are
              defined in `sections` below (real module cards, ready to show
              once those areas are built) but intentionally have no tab here
              — only Crop Monitoring and Organization are live right now. */}
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[14px] font-black uppercase tracking-widest transition-all pb-4 border-b-4 ${
                currentTabId === tab.id
                  ? 'text-green-600 border-green-600'
                  : 'text-slate-700 border-transparent hover:text-slate-900 font-bold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-12">
          <div className="max-w-2xl">
            <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900 mb-4">{currentSection.title}</h3>
            <p className="text-[13px] text-slate-800 font-bold leading-relaxed uppercase tracking-wider">
              {currentSection.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {currentSection.modules.map(module => (
              <ModuleCard 
                key={module.id} 
                {...module} 
                onSelect={onSelectModule}
              />
            ))}
          </div>
        </div>

        <footer className="mt-48 pt-12 flex flex-col lg:flex-row justify-between items-center gap-12 pb-12 border-t border-slate-200">
            <div className="flex items-center gap-12">
               <div className="text-[11px] font-bold uppercase tracking-widest text-slate-700">© 2026 FarmIntelytics.</div>
               <div className="flex gap-8">
                  {['Docs', 'Status', 'Support'].map(i => (
                    <button key={i} className="text-[11px] font-black text-slate-800 hover:text-green-600 transition-colors uppercase tracking-widest">{i}</button>
                  ))}
               </div>
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Intelligence Layer v1.0</div>
        </footer>
      </div>
    </div>
  );
};

export default PortalHub;
