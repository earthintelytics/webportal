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
        <div className="min-h-screen bg-white flex items-center justify-center p-8">
          <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl p-7 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-gray-900">Something went wrong on this page</h2>
            <p className="text-sm text-gray-600">Try again. If it keeps happening, send the details below to the FarmIntelytics team.</p>
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer text-sm text-gray-700">Technical details</summary>
              <pre className="whitespace-pre-wrap font-mono mt-2">{this.state.error?.message}</pre>
            </details>
            <button onClick={() => this.setState({ error: null })} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800">Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import Login from './pages/Login';
import PortalHub from './pages/PortalHub';

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
const ServicePortal = lazyWithReload(() => import('./modules/services/ServicePortal'));
const SuitabilityPortal = lazyWithReload(() => import('./modules/suitability/SuitabilityPortal'));
const SmallholderHub = lazyWithReload(() => import('./modules/smallholder/SmallholderHub'));
const PublicFormPage = lazyWithReload(() => import('./modules/forms/PublicFormPage'));

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

import { resolveModule, canonicalModuleId, SMALLHOLDER_SERVICES, moduleName as moduleDisplayName } from './modules/registry';

const RouteLoading = () => (
  <div className="flex items-center justify-center h-screen bg-white">
    <div className="w-10 h-10 border-4 border-gray-100 border-t-green-600 rounded-full animate-spin" />
  </div>
);

// ─── Build-time access restriction ──────────────────────────────────────────
// If VITE_RESTRICT_TO_MODULE is set (e.g. in netlify.toml), the app bypasses
// the hub and locks users into that single module.
const RESTRICTED_MODULE = import.meta.env.VITE_RESTRICT_TO_MODULE || null;

// The URL path used for the restricted module's portal
const AGROMONITOR_PATH = '/farmintelytics-engine/agromonitoring';


import TenantHub from './pages/TenantHub';
import { clearTenantSession, clearTeamSession } from './services/session';

// ─── Hub page ────────────────────────────────────────────────────────────────
// The hub is the FarmIntelytics team's own screen (every crop and organisation
// service) or an authenticated tenant's personalized multi-service launchpad.
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

// The hub to go back to: the one the service was opened from; otherwise the
// client's hub for a client and the team hub for the team.
const backHub = () => sessionStorage.getItem('fi_hub') || (hasTenantSession() ? '/tenant/hub' : '/');

const hasTenantSession = () => {
  try {
    const token = localStorage.getItem('fi_token');
    const tenant = localStorage.getItem('fi_tenant');
    return Boolean(token && tenant);
  } catch {
    return false;
  }
};

const HubPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teamSignedIn, setTeamSignedIn] = useState(hasValidTeamSession);
  const [tenantSignedIn, setTenantSignedIn] = useState(hasTenantSession);

  const handleSelectModule = (moduleId) => {
    sessionStorage.setItem('fi_module', moduleId);
    sessionStorage.setItem('fi_from_hub', '1');
    // Remember which hub the service was opened from, so Back returns there.
    sessionStorage.setItem('fi_hub', location.pathname.startsWith('/tenant') ? '/tenant/hub' : '/');
    if (moduleId.startsWith('custom-agromonitor')) {
      navigate(AGROMONITOR_PATH);
    } else {
      navigate(`/portal/${encodeURIComponent(moduleId)}`);
    }
  };

  const handleTeamSignOut = () => {
    clearTeamSession();
    setTeamSignedIn(false);
  };

  const handleTenantSignOut = () => {
    clearTenantSession();
    setTenantSignedIn(false);
    navigate('/login');
  };

  // "/" is the team hub; "/tenant/hub" is the client's own hub. A team member
  // who also signed in to a client account keeps the team hub at "/".
  const isClientHub = location.pathname.startsWith('/tenant');
  const teamHub = <PortalHub onSelectModule={handleSelectModule} onSignOut={handleTeamSignOut} onOpenAdmin={() => navigate('/admin/organizations')} />;
  const clientHub = <TenantHub onSelectModule={handleSelectModule} onSignOut={handleTenantSignOut} />;
  if (isClientHub) {
    if (tenantSignedIn) return clientHub;
    return teamSignedIn ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
  }
  if (teamSignedIn) return teamHub;
  if (tenantSignedIn) return <Navigate to="/tenant/hub" replace />;

  // Otherwise prompt admin login or redirect to login
  return <AdminLogin context="hub" onSuccess={() => setTeamSignedIn(true)} />;
};


// ─── Login page ──────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  const moduleId = RESTRICTED_MODULE
    || (directTenant ? `custom-agromonitor-${directTenant}` : null)
    || directModule
    || sessionStorage.getItem('fi_module');
  
  const moduleName = moduleDisplayName(moduleId) || moduleId;

  const handleLogin = () => {
    if (directModule) {
      navigate(`/portal/${encodeURIComponent(directModule)}`);
    } else if (directTenant || localStorage.getItem('fi_tenant')) {
      sessionStorage.setItem('fi_hub', '/tenant/hub');
      navigate('/tenant/hub');
    } else if (moduleId && moduleId.startsWith('custom-agromonitor')) {
      navigate(AGROMONITOR_PATH);
    } else if (moduleId) {
      navigate(`/portal/${encodeURIComponent(moduleId)}`);
    } else {
      navigate('/tenant/hub');
    }
  };

  const cameFromHub = hasValidTeamSession() || hasTenantSession() || sessionStorage.getItem('fi_from_hub') === '1';
  const handleBack = (RESTRICTED_MODULE || ((directTenant || directModule) && !cameFromHub)) ? null : () => navigate(backHub());

  return (
    <Login
      onLogin={handleLogin}
      moduleId={moduleId}
      moduleName={moduleName}
      onBack={handleBack}
    />
  );
};


// ─── Portal page (generic modules) ──────────────────────────────────────────
const CROP_APPS = {
  'rs-ffb': OilPalmMonitoring,
  'rs-sugarcane': SugarcaneMonitoring,
  'rs-rice': RiceMonitoring,
  'rs-cocoa': CocoaMonitoring,
  'rs-cassava': CassavaMonitoring,
  'rs-maize': MaizeMonitoring,
  'rs-cashew': CashewMonitoring,
  'rs-rubber': RubberMonitoring,
};

const PortalMessage = ({ title, text, action }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
    <h2 className="font-display text-3xl font-semibold text-[var(--text-main)] mb-3 tracking-tight">{title}</h2>
    <p className="text-[var(--text-muted)] max-w-md text-sm">{text}</p>
    {action}
  </div>
);

const PortalPage = () => {
  const navigate = useNavigate();
  const { moduleId: moduleFromUrl } = useParams();
  const rawId = moduleFromUrl || sessionStorage.getItem('fi_module');
  const moduleId = canonicalModuleId(rawId);
  useEffect(() => { if (moduleId) sessionStorage.setItem('fi_module', moduleId); }, [moduleId]);

  const handleSignOut = () => {
    clearTenantSession();
    navigate(`/login?module=${encodeURIComponent(moduleId || '')}`);
  };
  // Smallholder services go back to the Smallholder hub; everything else to the hub.
  // Back goes to where the user came from: a Smallholder service to the
  // Smallholder hub, the team to the team hub, a client to its own hub.
  const handleBackToHub = () => navigate(
    SMALLHOLDER_SERVICES.includes(moduleId) ? '/portal/smallholder-hub' : backHub(),
  );

  if (!moduleId) return <Navigate to="/" replace />;
  if (moduleFromUrl !== moduleId) return <Navigate to={`/portal/${encodeURIComponent(moduleId)}`} replace />;

  const team = hasValidTeamSession();
  const backButton = (label, onClick) => (
    <button onClick={onClick} className="mt-8 px-6 py-3 bg-white text-[var(--text-main)] border border-[var(--border-light)] rounded-xl font-semibold text-sm hover:bg-[var(--bg-main)] transition-colors">{label}</button>
  );
  // Clients arrive by direct link and never see the internal hub: send them
  // back to their own sign-in; the team goes back to the hub.
  const exitAction = team ? backButton('Back to hub', handleBackToHub) : backButton('Back to sign in', handleSignOut);

  const mod = resolveModule(moduleId);
  if (!mod) {
    return <PortalMessage title="Not available" text="This link does not open a FarmIntelytics service." action={exitAction} />;
  }

  // Every service except the team-only tools shows a client's data, so it
  // needs a client sign-in (the team signs in with a client account, e.g. the
  // demo account). Go straight to that service's sign-in instead of opening
  // the page and bouncing out of it.
  if (!hasTenantSession() && !(team && mod.teamOnly)) {
    return <Navigate to={`/login?module=${encodeURIComponent(moduleId)}`} replace />;
  }

  // Licensing: the admin portal assigns each organisation its modules
  // (TenantConfig.allowed_modules, stored at sign-in). Team-only tools never
  // open for a client.
  let allowedModules = null;
  try {
    const raw = localStorage.getItem('fi_allowed_modules');
    if (raw) allowedModules = JSON.parse(raw);
  } catch { allowedModules = null; }
  let allowedCrops;
  try { allowedCrops = JSON.parse(localStorage.getItem('fi_allowed_crops') || '[]') || []; } catch { allowedCrops = []; }
  const allowed = Array.isArray(allowedModules) ? allowedModules.map(canonicalModuleId) : [];
  const notLicensed = mod.kind === 'smallholder'
    ? !allowed.some((m) => m === moduleId || SMALLHOLDER_SERVICES.includes(m))
    : mod.kind === 'crop'
      ? !allowed.includes(moduleId) && !allowedCrops.includes(moduleId.replace('rs-', ''))
      : !allowed.includes(moduleId);
  if (!team && (mod.teamOnly || notLicensed)) {
    return <PortalMessage title="Not enabled" text="This service is not enabled for your organisation. Contact your administrator to request access." action={exitAction} />;
  }

  const props = { onSignOut: handleSignOut, onBack: handleBackToHub };
  let content;
  if (mod.kind === 'crop') {
    const CropApp = CROP_APPS[moduleId];
    content = <CropApp {...props} />;
  } else if (mod.kind === 'suitability') {
    content = <SuitabilityPortal {...props} />;
  } else if (mod.kind === 'smallholder') {
    content = <SmallholderHub {...props} />;
  } else {
    content = <ServicePortal moduleId={moduleId} {...props} />;
  }
  return <ErrorBoundary key={moduleId}>{content}</ErrorBoundary>;
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
        <Route path="/hub"                    element={<HubPage />} />
        <Route path="/tenant/hub"             element={<HubPage />} />
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/f/:token"               element={<PublicFormPage />} />
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
