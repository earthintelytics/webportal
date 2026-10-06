import React from 'react';
import { 
  ArrowRight, 
  Globe, 
  Activity, 
  MessageSquare, 
  Leaf, 
  Satellite,
  Trees,
  Target
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
import { fetchOrganizations } from '../services/adminApi';
import { HERO_PLACEHOLDERS } from '../constants/heroPlaceholders';

// Photo per service (compressed WebP in /public/crops). Organisation cards use
// the organisation photo unless the organisation has uploaded its own logo.
const CARD_PHOTOS = {
  'rs-ffb': '/crops/oil_palm.webp',
  'rs-maize': '/crops/maize.webp',
  'rs-rice': '/crops/rice.webp',
  'rs-cassava': '/crops/cassava.webp',
  'rs-cocoa': '/crops/cocoa.webp',
  'rs-sugarcane': '/crops/sugarcane.webp',
  'rs-cashew': '/crops/cashew.webp',
  'rs-rubber': '/crops/rubber.webp',
  'rs-drone': '/crops/drone.webp',
  'smallholder-hub': '/crops/smallholder.webp',
  'carbon-ffb': '/crops/estate_carbon.webp', 'carbon-groups': '/crops/group_carbon.webp',
  'forestry-intel': '/crops/forestry.webp', 'carbon-estimator': '/crops/estimator.webp',
  'land-restoration': '/crops/restoration.webp', 'eudr-check': '/crops/eudr.webp',
  'suitability-tool': '/crops/suitability.webp',
  'advisor': '/crops/advisor.webp',
};
const photoFor = (id) => CARD_PHOTOS[id] || (id?.startsWith('org:') ? '/crops/organization.webp' : null);

const ModuleCard = ({ title, crop, id, icon, active, onSelect, logoUrl }) => {
  const photo = photoFor(id);
  return (
    <button
      onClick={() => active && onSelect(id)}
      disabled={!active}
      className={`group flex flex-col text-left bg-white rounded-2xl border border-slate-200 overflow-hidden transition-colors ${
        active ? 'hover:border-slate-300' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div
        className="relative h-36 w-full overflow-hidden bg-slate-100 bg-cover bg-center"
        style={photo && HERO_PLACEHOLDERS[photo] ? { backgroundImage: `url(${HERO_PLACEHOLDERS[photo]})` } : undefined}
      >
        {photo && (
          <img
            src={photo}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover saturate-[0.9] transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {(logoUrl || !photo) && (
          <div className="absolute left-4 bottom-4 w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
            {logoUrl ? <img src={logoUrl} alt="" className="w-7 h-7 object-contain" /> : React.cloneElement(icon, { size: 22, strokeWidth: 1.75 })}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-5">
        <p className="text-xs font-medium text-slate-500">{crop}</p>
        <h3 className="font-display text-lg font-semibold text-slate-900 leading-snug mt-1">{title}</h3>
        <span className={`mt-5 flex items-center gap-1.5 text-sm font-medium ${active ? 'text-[var(--brand-primary)]' : 'text-slate-400'}`}>
          Open
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
};

const PortalHub = ({ onSelectModule, onSignOut, onOpenAdmin }) => {
  const [activeTab, setActiveTab] = React.useState('monitoring');
  // Organisations come from the backend (Admin → Organisations); none are listed here.
  const [customModules, setCustomModules] = React.useState([]);

  // Load tenant list for the Organization section (dynamic agro-monitoring cards)
  React.useEffect(() => {
    async function loadTenants() {
      try {
        // The team's own list (admin API); the client API needs a client sign-in.
        const res = await fetchOrganizations();
        const orgs = Array.isArray(res) ? res : res?.items || [];
        // Each card opens that organisation's own hub (/org/<slug>).
        setCustomModules(orgs.map(o => ({
          id: `org:${o.schema_name}`,
          title: o.display_name || o.schema_name,
          crop: `/org/${o.schema_name}`,
          icon: <Satellite />,
          active: o.is_active !== false,
          logoUrl: o.logo_url || '',
        })));
      } catch (err) {
        console.error("Failed to fetch organisations:", err);
      }
    }
    loadTenants();
  }, []);

  // Internal team hub: every crop and organisation service is always shown.
  // Clients reach their own service through a direct login link instead.
  const filterModules = (modules) => modules.map(m => ({ ...m, active: m.active !== false }));

  const sections = [
    {
      id: 'monitoring',
      title: 'Crop monitoring',
      description: 'Crop condition, water, weather and alerts per field, for each crop.',
      modules: filterModules([
        { id: 'rs-ffb',       title: 'Oil palm',   crop: 'Crop monitoring', icon: <OilPalmIcon /> },
        { id: 'rs-cocoa',     title: 'Cocoa',      crop: 'Crop monitoring', icon: <CocoaIcon /> },
        { id: 'rs-rubber',    title: 'Rubber',     crop: 'Crop monitoring', icon: <RubberIcon /> },
        { id: 'rs-cashew',    title: 'Cashew',     crop: 'Crop monitoring', icon: <CashewIcon /> },
        { id: 'rs-maize',     title: 'Maize',      crop: 'Crop monitoring', icon: <MaizeIcon /> },
        { id: 'rs-rice',      title: 'Rice',       crop: 'Crop monitoring', icon: <RiceIcon /> },
        { id: 'rs-cassava',   title: 'Cassava',    crop: 'Crop monitoring', icon: <CassavaIcon /> },
        { id: 'rs-sugarcane', title: 'Sugarcane',  crop: 'Crop monitoring', icon: <SugarcaneIcon /> },
      ]),
    },
    {
      id: 'engine',
      title: 'Engine',
      description: 'Processing services that turn your own imagery into maps and counts.',
      modules: filterModules([
        { id: 'rs-drone', title: 'Drone surveys', crop: 'Drone imagery', icon: <DroneIcon /> },
      ]),
    },
    {
      id: 'sustainability',
      title: 'Sustainability',
      description: 'Carbon, forests, restoration and deforestation evidence for estates and supply chains.',
      modules: filterModules([
        { id: 'carbon-ffb',       title: 'Estate carbon',         crop: 'Estates',                 icon: <Leaf /> },
        { id: 'forestry-intel',   title: 'Forestry intelligence', crop: 'Forests',                 icon: <Trees /> },
        { id: 'carbon-estimator', title: 'Carbon estimator',      crop: 'Planning',                icon: <Activity /> },
        { id: 'land-restoration', title: 'Land restoration',      crop: 'Restoration sites',       icon: <Leaf /> },
        { id: 'eudr-check',       title: 'EUDR check',            crop: 'Oil palm, cocoa, rubber', icon: <Globe /> },
      ]),
    },
    {
      id: 'field-advisory',
      title: 'Field advisory',
      description: 'Advice for farmers and co-operatives, smallholder registers and forms, and land suitability.',
      modules: filterModules([
        { id: 'smallholder-hub',  title: 'Smallholder',      crop: 'Co-operatives and outgrowers', icon: <SmallholderIcon /> },
        { id: 'advisor',          title: 'Farm AI advisor',  crop: 'Advice per field',             icon: <MessageSquare /> },
        { id: 'suitability-tool', title: 'Crop suitability', crop: 'FarmIntelytics team only',     icon: <Target /> },
      ]),
    },
    {
      id: 'custom',
      title: 'Organisations',
      description: "Each client organisation's own hub, with the services it was given at onboarding.",
      modules: filterModules(customModules),
    },
  ];

  // Organisations come last. Management and Finance & ledger are not in the
  // current plan and have no tab.
  const visibleTabs = [
    { id: 'monitoring', label: 'Crop monitoring' },
    { id: 'sustainability', label: 'Sustainability' },
    { id: 'field-advisory', label: 'Field advisory' },
    { id: 'engine', label: 'Engine' },
    { id: 'custom', label: 'Organisations' },
  ].filter(tab => (sections.find(s => s.id === tab.id)?.modules.length ?? 0) > 0);
  const currentTabId = visibleTabs.some(t => t.id === activeTab) ? activeTab : visibleTabs[0]?.id;
  const currentSection = sections.find(s => s.id === currentTabId) || sections[0];

  const orgCount = sections.find(s => s.id === 'custom')?.modules.length ?? 0;
  const serviceCount = sections.filter(s => s.id !== 'custom' && visibleTabs.some(v => v.id === s.id)).reduce((n, s) => n + s.modules.length, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/farmintelytics-logo.png" alt="FarmIntelytics" className="h-10 w-10 object-contain" width="40" height="40" />
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">FarmIntelytics</p>
              <p className="text-xs text-[var(--text-muted)]">Platform hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onOpenAdmin && (
              <button onClick={onOpenAdmin} className="px-4 py-2 rounded-[10px] border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50 transition-colors">
                Admin console
              </button>
            )}
            {onSignOut && (
              <button onClick={onSignOut} className="px-4 py-2 rounded-[10px] text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-14">
        <section className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--brand-primary)]">FarmIntelytics team</p>
          <h1 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight mt-2">Every service, one place.</h1>
          <p className="text-base text-[var(--text-muted)] leading-relaxed mt-4">
            Open any service or organisation to check it the way a client sees it. Clients never see this page &mdash; each gets a direct link to their own sign-in.
          </p>
          <p className="text-sm text-slate-500 mt-5">{serviceCount} services &middot; {orgCount} organisations</p>
        </section>

        <nav className="mt-12 flex gap-8 border-b border-slate-200">
          {visibleTabs.map(tab => {
            const count = sections.find(s => s.id === tab.id)?.modules.length ?? 0;
            const on = currentTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px pb-3 border-b-2 text-sm font-medium transition-colors ${
                  on ? 'border-[var(--brand-primary)] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
              </button>
            );
          })}
        </nav>

        <section className="mt-8">
          <p className="text-sm text-[var(--text-muted)] max-w-2xl">{currentSection.description}</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentSection.modules.map(module => (
              <ModuleCard key={module.id} {...module} onSelect={onSelectModule} />
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 lg:px-10 py-10 border-t border-slate-200 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} FarmIntelytics &middot; Internal platform hub
      </footer>
    </div>
  );
};

export default PortalHub;
