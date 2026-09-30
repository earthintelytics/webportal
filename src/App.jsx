import React, { useState, useEffect, Component } from 'react';

// After a new deploy the page chunks get new file names; a tab opened before
// the deploy still asks for the old ones and the import fails ("Failed to
// fetch dynamically imported module"). Reload once to pick up the new build
// instead of showing an error.
const RELOAD_KEY = 'fi_chunk_reload';
const isChunkError = (e) => /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(String(e?.message || e));
const lazyWithReload = (factory) => React.lazy(() => factory().then(
  (m) => { sessionStorage.removeItem(RELOAD_KEY); return m; },
  (e) => {
    if (isChunkError(e) && !sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
      return new Promise(() => {}); // keep the loading state until the reload
    }
    throw e;
  },
));

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'var(--font-mono)', background: '#0f172a', color: '#f87171', minHeight: '100vh' }}>
          <h2 style={{ color: '#fca5a5', marginBottom: 16 }}>Render Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#94a3b8', marginTop: 12 }}>{this.state.error?.stack}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 20, padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import Login from './pages/Login';
import PortalHub from './pages/PortalHub';
import PortalLayout from './layouts/PortalLayout';

// Everything below is route-gated content — a user only ever needs ONE of
// these per session, but they used to all be top-level imports, so every
// visitor downloaded the entire app (every crop dashboard, every
// sustainability portal, the whole admin console) just to see the login
// screen. React.lazy() + the <Suspense> boundary in App below means each
// chunk is only fetched when its route actually renders.

// === FFB Management ===

// === Crop Management Portals ===


// === Sustainability, Field Advisory & Finance ===
// One portal for all of them: the organisation monitoring layout with the
// sub-pages each service defines in modules/services/serviceCatalog.js.
const ServicePortal = lazyWithReload(() => import('./modules/services/ServicePortal'));

// === Specialized Monitoring Apps ===
const RiceMonitoring = lazyWithReload(() => import('./modules/monitoring/rice/Monitoring'));
const MaizeMonitoring = lazyWithReload(() => import('./modules/monitoring/maize/Monitoring'));
const CocoaMonitoring = lazyWithReload(() => import('./modules/monitoring/cocoa/Monitoring'));
const OilPalmMonitoring = lazyWithReload(() => import('./modules/monitoring/oil_palm/Monitoring'));
const CassavaMonitoring = lazyWithReload(() => import('./modules/monitoring/cassava/Monitoring'));
const SugarcaneMonitoring = lazyWithReload(() => import('./modules/monitoring/sugarcane/Monitoring'));
const CashewMonitoring = lazyWithReload(() => import('./modules/monitoring/cashew/Monitoring'));
const RubberMonitoring = lazyWithReload(() => import('./modules/monitoring/rubber/Monitoring'));

// === Cooperative & Group Management ===

const OrganizationMonitor = lazyWithReload(() => import('./modules/organization-monitor/OrganizationMonitor'));

// === Super Admin Portal ===
import AdminLogin from './farmintelytics-admin/AdminLogin';
const AdminPortal = lazyWithReload(() => import('./farmintelytics-admin/AdminPortal'));

import { crops } from './constants/crops.jsx';
import { isServiceModule } from './modules/services/serviceCatalog';
import { Zap } from 'lucide-react';

const RouteLoading = () => (
  <div className="flex items-center justify-center h-screen bg-white">
    <div className="w-10 h-10 border-4 border-gray-100 border-t-green-600 rounded-full animate-spin" />
  </div>
);

// Placeholder for modules in development
const ComingSoon = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center h-full p-20 text-center bg-white">
    <div className="w-20 h-20 rounded-[2.5rem] bg-white border border-[var(--border-light)] flex items-center justify-center mx-auto mb-8 shadow-premium">
      <Zap size={32} className="text-[var(--brand-primary)]" />
    </div>
    <h2 className="font-display text-3xl font-semibold text-[var(--text-main)] mb-4 tracking-tight">{title}</h2>
    <p className="text-[var(--text-muted)] max-w-md text-sm">{description}</p>
  </div>
);

// ─── Module name map ─────────────────────────────────────────────────────────
const MODULE_NAMES = {
  'rs-ffb':               'Oil Palm Monitoring',
  'rs-cashew':            'Cashew Monitoring',
  'rs-sugarcane':         'SugarCane Monitoring',
  'rs-rice':              'Rice Monitoring',
  'rs-cocoa':             'Cocoa Monitoring',
  'rs-rubber':            'Rubber Monitoring',
  'rs-cassava':           'Cassava Monitoring',
  'rs-maize':             'Maize Monitoring',
  'rs-drone':             'Drone Intelligence',
  'finance-hub':          'Central Ledger',
  'carbon-ffb':           'Estate Carbon',
  'carbon-groups':        'Group Carbon',
  'forestry-intel':       'Forestry Intelligence',
  'carbon-estimator':     'Carbon Estimator',
  'land-restoration':     'Land Restoration',
  'eudr-check':           'EUDR Check',
  'management-ffb':       'Oil Palm Management',
  'management-cashew':    'Cashew Management',
  'management-sugarcane': 'SugarCane Management',
  'management-rice':      'Rice Management',
  'management-cocoa':     'Cocoa Management',
  'management-rubber':    'Rubber Management',
  'management-cassava':   'Cassava Management',
  'management-maize':     'Maize Management',
  'group-management':     'Groups Management',
  'group-monitoring':     'Group Monitoring',
  'activity-ffb':         'Field Logs',
  'advisor':              'Farm Advisor',
  'custom-agromonitor':   'Agro Monitoring',
  'custom-agromonitor-olam': 'Olam Agro Monitoring',
  'custom-agromonitor-okomu': 'Okomu Agro Monitoring',
};

// ─── Build-time access restriction ──────────────────────────────────────────
// If VITE_RESTRICT_TO_MODULE is set (e.g. in netlify.toml), the app bypasses
// the hub and locks users into that single module.
const RESTRICTED_MODULE = import.meta.env.VITE_RESTRICT_TO_MODULE || null;

// The URL path used for the restricted module's portal
const AGROMONITOR_PATH = '/farmintelytics-engine/agromonitoring';


// ─── Hub page ────────────────────────────────────────────────────────────────
// The hub is the FarmIntelytics team's own screen (every crop and organisation
// service). Clients never see it: they get a direct link to their service's
// login — /login?tenant=<org> or /login?module=<module-id>.
const hasValidTeamSession = () => {
  try {
    const token = localStorage.getItem('fi_admin_token');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'superadmin' && (!payload.exp || payload.exp * 1000 > Date.now());
  } catch {
    return false;
  }
};

const HubPage = () => {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(hasValidTeamSession);

  if (!signedIn) return <AdminLogin context="hub" onSuccess={() => setSignedIn(true)} />;

  const handleSelectModule = (moduleId) => {
    sessionStorage.setItem('fi_module', moduleId);
    sessionStorage.setItem('fi_from_hub', '1'); // keeps "Back to hub" on the sign-in even if the team token expires
    navigate(`/login?module=${encodeURIComponent(moduleId)}`);
  };
  const handleSignOut = () => {
    localStorage.removeItem('fi_admin_token');
    localStorage.removeItem('fi_admin_email');
    setSignedIn(false);
  };

  return <PortalHub onSelectModule={handleSelectModule} onSignOut={handleSignOut} onOpenAdmin={() => navigate('/admin/organizations')} />;
};


// ─── Login page ──────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Direct client links: ?tenant=<org> (organisation services) or
  // ?module=<module-id> (e.g. rs-ffb for oil palm crop monitoring).
  const searchParams = new URLSearchParams(location.search);
  const directTenant = searchParams.get('tenant') || searchParams.get('org') || null;
  const directModule = searchParams.get('module') || null;

  useEffect(() => {
    if (directTenant) {
      sessionStorage.setItem('fi_module', `custom-agromonitor-${directTenant}`);
      sessionStorage.setItem('fi_target_tenant', directTenant);
    } else if (directModule) {
      sessionStorage.setItem('fi_module', directModule);
    }
  }, [directTenant, directModule]);

  // In restricted mode the module is fixed; otherwise read from the link or sessionStorage
  const moduleId = RESTRICTED_MODULE
    || (directTenant ? `custom-agromonitor-${directTenant}` : null)
    || directModule
    || sessionStorage.getItem('fi_module');
  
  // Dynamically onboarded organizations get a friendly title derived from their slug
  const prettyDynamicName = (id) => {
    if (!id?.startsWith('custom-agromonitor-')) return id;
    const words = id.replace('custom-agromonitor-', '').split(/[_-]+/).filter(Boolean);
    const title = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `${title} Agro Monitoring`;
  };
  const moduleName = MODULE_NAMES[moduleId] || prettyDynamicName(moduleId);

  // Where does the portal land after login?
  const portalPath = (moduleId && (moduleId.startsWith('custom-agromonitor') || directTenant))
    ? AGROMONITOR_PATH
    : moduleId ? `/portal/${encodeURIComponent(moduleId)}` : '/';

  const handleLogin = () => navigate(portalPath);
  // Clients arriving by direct link never see a way back to the internal hub;
  // the FarmIntelytics team (signed in to the hub) always does.
  const cameFromHub = hasValidTeamSession() || sessionStorage.getItem('fi_from_hub') === '1';
  const handleBack  = (RESTRICTED_MODULE || ((directTenant || directModule) && !cameFromHub)) ? null : () => navigate('/');

  return (
    <Login
      onLogin={handleLogin}
      moduleName={moduleName}
      onBack={handleBack}
    />
  );
};


// ─── Portal page (generic modules) ──────────────────────────────────────────
const PortalPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentCrop, setCurrentCrop]     = useState(crops[0]);

  // The module is part of the URL (/portal/<module-id>) so a refresh or a
  // shared link opens the same service; /portal alone falls back to the
  // module chosen before sign-in.
  const { moduleId: moduleFromUrl } = useParams();
  const moduleId = moduleFromUrl || sessionStorage.getItem('fi_module');
  useEffect(() => { if (moduleFromUrl) sessionStorage.setItem('fi_module', moduleFromUrl); }, [moduleFromUrl]);

  const handleSignOut   = () => {
    // These used to be left in localStorage — a signed-out session could
    // resume via back-button or direct navigation, since nothing here
    // actually cleared it (unlike the admin portal's logout).
    ['fi_token', 'fi_email', 'fi_tenant', 'fi_role', 'fi_full_name',
     'fi_display_name', 'fi_allowed_modules', 'fi_allowed_crops', 'fi_map_center']
      .forEach(key => localStorage.removeItem(key));
    navigate(`/login?module=${encodeURIComponent(moduleId || '')}`);
    setActiveSection('dashboard');
  };
  const handleBackToHub = () => { navigate('/');     setActiveSection('dashboard'); };

  if (!moduleId) return <Navigate to="/" replace />;
  if (!moduleFromUrl) return <Navigate to={`/portal/${encodeURIComponent(moduleId)}`} replace />;

  // ── Organization-level module licensing ──
  // The admin portal assigns each organization its allowed modules
  // (TenantConfig.allowed_modules); the list is stored at login. A module
  // outside that list must not open, whichever tile was clicked.
  let allowedModules = null;
  try {
    const raw = localStorage.getItem('fi_allowed_modules');
    if (raw) allowedModules = JSON.parse(raw);
  } catch { allowedModules = null; }
  if (Array.isArray(allowedModules) && allowedModules.length > 0 && !allowedModules.includes(moduleId)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-20 text-center bg-white">
        <div className="w-20 h-20 rounded-[2.5rem] bg-white border border-[var(--border-light)] flex items-center justify-center mx-auto mb-8 shadow-premium">
          <Zap size={32} className="text-[var(--brand-primary)]" />
        </div>
        <h2 className="font-display text-3xl font-semibold text-[var(--text-main)] mb-4 tracking-tight">Not enabled</h2>
        <p className="text-[var(--text-muted)] max-w-md text-sm">
          This module is not enabled for your organization. Contact your administrator to request access.
        </p>
        {/* Clients arrive by direct link and never see the internal hub: send
            them back to their own sign-in; the team goes back to the hub. */}
        {hasValidTeamSession() ? (
          <button onClick={handleBackToHub} className="mt-8 px-6 py-3 bg-white text-[var(--text-main)] border border-[var(--border-light)] rounded-xl font-semibold text-sm shadow-sm hover:bg-[var(--bg-main)] transition-all">
            Back to Hub
          </button>
        ) : (
          <button onClick={() => { handleSignOut(); navigate(`/login?module=${encodeURIComponent(moduleId)}`); }} className="mt-8 px-6 py-3 bg-white text-[var(--text-main)] border border-[var(--border-light)] rounded-xl font-semibold text-sm shadow-sm hover:bg-[var(--bg-main)] transition-all">
            Back to sign in
          </button>
        )}
      </div>
    );
  }

  // ── resolve the component for this module ──
  const getContent = () => {
    // Remote-sensing monitoring portals
    // Services (and Drone surveys / Smallholder monitoring) use the shared layout
    if (isServiceModule(moduleId)) {
      return <ServicePortal moduleId={moduleId} onSignOut={handleSignOut} onBack={handleBackToHub} />;
    }
    if (moduleId.startsWith('rs-')) {
      const rsApps = {
        'rs-ffb':      <OilPalmMonitoring />,
        'rs-sugarcane':<SugarcaneMonitoring />,
        'rs-rice':     <RiceMonitoring />,
        'rs-cocoa':    <CocoaMonitoring />,
        'rs-cassava':  <CassavaMonitoring />,
        'rs-maize':    <MaizeMonitoring />,
        'rs-cashew':   <CashewMonitoring />,
        'rs-rubber':   <RubberMonitoring />,
      };
      if (rsApps[moduleId]) {
        return React.cloneElement(rsApps[moduleId], { onSignOut: handleSignOut, onBack: handleBackToHub });
      }
      return <ComingSoon title={moduleId.replace(/-/g, ' ')} description="This crop portal is not set up yet." />;
    }

    const routeMap = {
      'management-ffb': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,
      'management-cashew': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,
      'management-sugarcane': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,
      'management-rice': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,
      'management-cocoa': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,
      'management-rubber': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,
      'management-cassava': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,
      'management-maize': <ComingSoon title="Not in the current plan" description="Management dashboards are parked. They showed sample figures, which have been removed; they return with real data if they come back into the plan." />,

      'drone-ffb':    <ComingSoon title="Drone Inspection" description="Live drone feed and high-resolution field surveillance." />,
      'drone-cashew': <ComingSoon title="Orchard Survey" description="Tree count, canopy gap analysis and disease spot detection." />,


      'group-management': <ComingSoon title="Not in the current plan" description="Group management is parked. It showed sample figures, which have been removed." />,
    };

    // Sustainability, field advisory and finance services
    if (isServiceModule(moduleId)) {
      return <ServicePortal moduleId={moduleId} onSignOut={handleSignOut} onBack={handleBackToHub} />;
    }

    return routeMap[moduleId] || (
      <ComingSoon title={moduleId.replace(/-/g, ' ')} description="This module is under active development." />
    );
  };

  const content = getContent();

  // Standalone modules (full-screen, no PortalLayout sidebar)
  const standaloneModules = ['rs-', 'group-monitoring', 'carbon-', 'forestry-', 'advisor'];
  const isStandalone = isServiceModule(moduleId) || standaloneModules.some(m => moduleId.startsWith(m) || moduleId === m);

  if (isStandalone || moduleId === 'group-management') {
    // Pass back/signout handlers if the component accepts them (RS portals already have them)
    try {
      return <ErrorBoundary>{React.cloneElement(content, { onBack: handleBackToHub, onSignOut: handleSignOut })}</ErrorBoundary>;
    } catch {
      return <ErrorBoundary>{content}</ErrorBoundary>;
    }
  }

  return (
    <ErrorBoundary>
      <PortalLayout
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentCrop={currentCrop}
        setCurrentCrop={setCurrentCrop}
        crops={crops}
        onBackToHub={handleBackToHub}
        onSignOut={handleSignOut}
      >
        {content}
      </PortalLayout>
    </ErrorBoundary>
  );
};


// ─── Organization Monitor page (dedicated URL) ──────────────────────────────
const OrganizationMonitorPage = () => {
  const navigate = useNavigate();

  // In restricted mode there is no hub to go back to
  const handleSignOut   = () => navigate('/login');
  // Only the FarmIntelytics team has a way back to the internal hub
  const handleBackToHub = (RESTRICTED_MODULE || !hasValidTeamSession()) ? null : () => navigate('/');

  return <ErrorBoundary><OrganizationMonitor onSignOut={handleSignOut} onBack={handleBackToHub} /></ErrorBoundary>;
};


// ─── Root App ────────────────────────────────────────────────────────────────
const App = () => {
  // In restricted mode, always start at /login regardless of entered URL
  if (RESTRICTED_MODULE) {
    return (
      <React.Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path={AGROMONITOR_PATH} element={<OrganizationMonitorPage />} />
          {/* Redirect everything else to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/"                       element={<HubPage />} />
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/portal"                 element={<PortalPage />} />
        <Route path="/portal/:moduleId"       element={<PortalPage />} />
        <Route path={AGROMONITOR_PATH}        element={<OrganizationMonitorPage />} />
        <Route path="/admin/login"            element={<AdminLogin />} />
        <Route path="/admin/*"               element={<AdminPortal />} />
        {/* Catch-all: back to hub */}
        <Route path="*"                       element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default App;
