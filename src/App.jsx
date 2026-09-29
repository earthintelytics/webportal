import React, { useState, useEffect, Component } from 'react';

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
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
const FFBDashboard = React.lazy(() => import('./modules/management/ffb/Dashboard'));

// === Crop Management Portals ===
const CashewDashboard = React.lazy(() => import('./modules/management/cashew/Dashboard'));
const SugarcaneDashboard = React.lazy(() => import('./modules/management/sugarcane/Dashboard'));
const RiceDashboard = React.lazy(() => import('./modules/management/rice/Dashboard'));
const CocoaDashboard = React.lazy(() => import('./modules/management/cocoa/Dashboard'));
const RubberDashboard = React.lazy(() => import('./modules/management/rubber/Dashboard'));
const CassavaDashboard = React.lazy(() => import('./modules/management/cassava/Dashboard'));
const MaizeDashboard = React.lazy(() => import('./modules/management/maize/Dashboard'));

// === Field Advisory & Agronomy ===
const ClimateIntelligence = React.lazy(() => import('./modules/advisor/ClimateIntelligence'));
const MonitoringPortal = React.lazy(() => import('./modules/monitoring/MonitoringPortal'));
const EstatePortal = React.lazy(() => import('./modules/sustainability/estate/EstatePortal'));
const GroupsPortal = React.lazy(() => import('./modules/sustainability/groups/GroupsPortal'));
const ForestryPortal = React.lazy(() => import('./modules/sustainability/forestry/ForestryPortal'));
const EstimatorPortal = React.lazy(() => import('./modules/sustainability/estimator/EstimatorPortal'));

// === Specialized Monitoring Apps ===
const RiceMonitoring = React.lazy(() => import('./modules/monitoring/rice/Monitoring'));
const MaizeMonitoring = React.lazy(() => import('./modules/monitoring/maize/Monitoring'));
const CocoaMonitoring = React.lazy(() => import('./modules/monitoring/cocoa/Monitoring'));
const OilPalmMonitoring = React.lazy(() => import('./modules/monitoring/oil_palm/Monitoring'));
const CassavaMonitoring = React.lazy(() => import('./modules/monitoring/cassava/Monitoring'));
const SugarcaneMonitoring = React.lazy(() => import('./modules/monitoring/sugarcane/Monitoring'));
const CashewMonitoring = React.lazy(() => import('./modules/monitoring/cashew/Monitoring'));
const RubberMonitoring = React.lazy(() => import('./modules/monitoring/rubber/Monitoring'));

// === Cooperative & Group Management ===
const GroupsDashboard = React.lazy(() => import('./modules/cooperative/Dashboard'));

// === Finance & Payments ===
const FinanceDashboard = React.lazy(() => import('./modules/finance/Dashboard'));

const OrganizationMonitor = React.lazy(() => import('./modules/organization-monitor/OrganizationMonitor'));

// === Super Admin Portal ===
import AdminLogin from './farmintelytics-admin/AdminLogin';
const AdminPortal = React.lazy(() => import('./farmintelytics-admin/AdminPortal'));

import { crops } from './constants/crops.jsx';
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
    <h2 className="font-display text-4xl font-bold text-[var(--text-main)] mb-4 tracking-tight uppercase">{title}</h2>
    <p className="text-[var(--text-muted)] font-semibold max-w-md uppercase text-[11px] tracking-[0.2em]">{description}</p>
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
  'finance-hub':          'Central Finance Hub',
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
  'activity-ffb':         'Operations Logs',
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
    navigate('/login');
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
    : '/portal';

  const handleLogin = () => navigate(portalPath);
  // Clients arriving by direct link never see a way back to the internal hub
  const handleBack  = (RESTRICTED_MODULE || directTenant || directModule) ? null : () => navigate('/');

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

  const moduleId = sessionStorage.getItem('fi_module');

  const handleSignOut   = () => {
    // These used to be left in localStorage — a signed-out session could
    // resume via back-button or direct navigation, since nothing here
    // actually cleared it (unlike the admin portal's logout).
    ['fi_token', 'fi_email', 'fi_tenant', 'fi_role', 'fi_full_name',
     'fi_display_name', 'fi_allowed_modules', 'fi_allowed_crops', 'fi_map_center']
      .forEach(key => localStorage.removeItem(key));
    navigate('/login');
    setActiveSection('dashboard');
  };
  const handleBackToHub = () => { navigate('/');     setActiveSection('dashboard'); };

  if (!moduleId) return <Navigate to="/" replace />;

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
        <h2 className="font-display text-4xl font-bold text-[var(--text-main)] mb-4 tracking-tight uppercase">Not Enabled</h2>
        <p className="text-[var(--text-muted)] font-semibold max-w-md uppercase text-[11px] tracking-[0.2em]">
          This module is not enabled for your organization. Contact your administrator to request access.
        </p>
        {/* Clients arrive by direct link and never see the internal hub: send
            them back to their own sign-in; the team goes back to the hub. */}
        {hasValidTeamSession() ? (
          <button onClick={handleBackToHub} className="mt-8 px-6 py-3 bg-white text-[var(--text-main)] border border-[var(--border-light)] rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[var(--bg-main)] transition-all">
            Back to Hub
          </button>
        ) : (
          <button onClick={() => { handleSignOut(); navigate(`/login?module=${encodeURIComponent(moduleId)}`); }} className="mt-8 px-6 py-3 bg-white text-[var(--text-main)] border border-[var(--border-light)] rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[var(--bg-main)] transition-all">
            Back to sign in
          </button>
        )}
      </div>
    );
  }

  // ── resolve the component for this module ──
  const getContent = () => {
    // Remote-sensing monitoring portals
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
      const cropMap = { 'rs-drone': 'Drone Intelligence' };
      return <MonitoringPortal cropName={cropMap[moduleId] || 'Crop'} onSignOut={handleSignOut} onBack={handleBackToHub} />;
    }

    const routeMap = {
      'management-ffb':       <FFBDashboard activeSection={activeSection} />,
      'management-cashew':    <CashewDashboard activeSection={activeSection} />,
      'management-sugarcane': <SugarcaneDashboard activeSection={activeSection} />,
      'management-rice':      <RiceDashboard activeSection={activeSection} />,
      'management-cocoa':     <CocoaDashboard activeSection={activeSection} />,
      'management-rubber':    <RubberDashboard activeSection={activeSection} />,
      'management-cassava':   <CassavaDashboard activeSection={activeSection} />,
      'management-maize':     <MaizeDashboard activeSection={activeSection} />,

      'drone-ffb':    <ComingSoon title="Drone Inspection" description="Live drone feed and high-resolution field surveillance." />,
      'drone-cashew': <ComingSoon title="Orchard Survey" description="Tree count, canopy gap analysis and disease spot detection." />,

      'carbon-ffb':       <EstatePortal onSignOut={handleSignOut} onBack={handleBackToHub} />,
      'carbon-groups':    <GroupsPortal onSignOut={handleSignOut} onBack={handleBackToHub} />,
      'forestry-intel':   <ForestryPortal onSignOut={handleSignOut} onBack={handleBackToHub} />,
      'carbon-estimator': <EstimatorPortal onSignOut={handleSignOut} onBack={handleBackToHub} />,

      'finance-hub':  <FinanceDashboard onSignOut={handleSignOut} />,
      'activity-ffb': <ComingSoon title="Operations Log" description="Geo-referenced daily field logs — harvesting, planting, spraying." />,
      'advisor':      <ClimateIntelligence onSignOut={handleSignOut} onBack={handleBackToHub} />,

      'group-management': <GroupsDashboard mode="group-management" onSignOut={handleSignOut} />,
      'group-monitoring': <MonitoringPortal cropName="Smallholder" onSignOut={handleSignOut} onBack={handleBackToHub} />,
    };

    return routeMap[moduleId] || (
      <ComingSoon title={moduleId.replace(/-/g, ' ')} description="This module is under active development." />
    );
  };

  const content = getContent();

  // Standalone modules (full-screen, no PortalLayout sidebar)
  const standaloneModules = ['rs-', 'group-monitoring', 'carbon-', 'forestry-', 'advisor'];
  const isStandalone = standaloneModules.some(m => moduleId.startsWith(m) || moduleId === m);

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
