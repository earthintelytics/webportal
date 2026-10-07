import React, { useState, useEffect, Component } from 'react';
import AdminActivity from './farmintelytics-admin/components/AdminActivity';

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

// === Sustainability, Field Advisory & Finance ===
// One portal for all of them: the organisation monitoring layout with the
const ServicePortal = lazyWithReload(() => import('./modules/services/ServicePortal'));
const SuitabilityPortal = lazyWithReload(() => import('./modules/suitability/SuitabilityPortal'));
const SmallholderHub = lazyWithReload(() => import('./modules/smallholder/SmallholderHub'));
const PublicFormPage = lazyWithReload(() => import('./modules/forms/PublicFormPage'));

// === Crop monitoring (one portal for every crop) ===
const CropPortal = lazyWithReload(() => import('./modules/monitoring/CropPortal'));

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

import OrgShell from './pages/org/OrgShell';
import OrgServicesPage from './pages/org/OrgServicesPage';
import OrgSettingsPage from './pages/org/OrgSettingsPage';
import FieldPage from './pages/org/FieldPage';
import { readOrgProfile } from './pages/org/orgProfile';
import { paths, sessionTenant } from './routes/paths';
import { clearTenantSession, clearTeamSession, hasValidTeamToken } from './services/session';

// ─── Hub page ────────────────────────────────────────────────────────────────
// The hub is the FarmIntelytics team's own screen (every crop and organisation
// service) or an authenticated tenant's personalized multi-service launchpad.
const hasValidTeamSession = hasValidTeamToken;

// "Back to hub" on an organisation's page always means that organisation's
// own hub, never the FarmIntelytics team hub or the admin console. Team-only
// tools (/tools/<id>) go back to the team hub.
const backHub = (tenant) => (tenant ? paths.orgHub(tenant) : '/');

// "/" is the team hub. A client who lands here goes to its own hub.
const HubPage = () => {
  const navigate = useNavigate();
  const [teamSignedIn, setTeamSignedIn] = useState(hasValidTeamSession);

  const handleSelectModule = (id) => {
    // Organisation cards open that organisation's own hub (signing in with
    // one of its accounts if needed).
    if (id.startsWith('org:')) {
      const org = id.slice(4);
      navigate(sessionTenant() === org ? paths.orgHub(org) : paths.orgLogin(org));
      return;
    }
    navigate(paths.service(id, sessionTenant()));
  };

  const handleTeamSignOut = () => {
    clearTeamSession();
    setTeamSignedIn(false);
  };

  if (teamSignedIn) return <PortalHub onSelectModule={handleSelectModule} onSignOut={handleTeamSignOut} onOpenAdmin={() => navigate('/admin/organizations')} />;
  const tenant = sessionTenant();
  if (tenant) return <Navigate to={paths.orgHub(tenant)} replace />;
  return <AdminLogin context="hub" onSuccess={() => setTeamSignedIn(true)} />;
};

// /org/<tenant> and /org/<tenant>/settings. The URL names the organisation;
// a session for another organisation (or none) goes to this one's sign-in.
const OrgPage = ({ view }) => {
  const { tenant } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(readOrgProfile);
  if (sessionTenant() !== tenant) return <Navigate to={paths.orgLogin(tenant)} replace />;
  const signOut = () => { clearTenantSession(); navigate(paths.orgLogin(tenant)); };
  return (
    <OrgShell profile={profile} onSignOut={signOut}>
      {view === 'settings' ? <OrgSettingsPage profile={profile} onProfile={setProfile} /> : view === 'field' ? <FieldPage /> : <OrgServicesPage profile={profile} />}
    </OrgShell>
  );
};

// Old addresses → the new ones (paths.js).
const LegacyTenantHub = () => {
  const tenant = sessionTenant();
  return <Navigate to={tenant ? paths.orgHub(tenant) : '/login'} replace />;
};
const LegacyPortal = () => {
  const { moduleId } = useParams();
  return <Navigate to={paths.service(canonicalModuleId(moduleId), sessionTenant())} replace />;
};


// ─── Login page ──────────────────────────────────────────────────────────────
// /org/<tenant>/login signs in to one organisation; /login?module=<id> signs
// in from a service link. After sign-in the person lands on the organisation
// hub, or on the service they came for (?next=<id>).
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant: urlTenant } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const legacyTenant = searchParams.get('tenant') || searchParams.get('org');
  const directModule = searchParams.get('module') || searchParams.get('next') || null;
  const moduleId = RESTRICTED_MODULE || directModule;

  useEffect(() => {
    if (urlTenant) sessionStorage.setItem('fi_target_tenant', urlTenant);
  }, [urlTenant]);

  if (!urlTenant && legacyTenant) return <Navigate to={paths.orgLogin(legacyTenant)} replace />;

  const handleLogin = () => {
    const tenant = sessionTenant();
    if (!tenant) return;
    navigate(moduleId ? paths.service(moduleId, tenant) : paths.orgHub(tenant), { replace: true });
  };

  // Back to the organisation's hub only for someone already signed in to
  // this organisation; nobody is sent to another hub from a sign-in page.
  const hasOrgAccess = !!urlTenant && sessionTenant() === urlTenant;
  const handleBack = (RESTRICTED_MODULE || !hasOrgAccess) ? null : () => navigate(paths.orgHub(urlTenant));

  return (
    <Login
      onLogin={handleLogin}
      moduleId={moduleId}
      tenant={urlTenant || null}
      moduleName={moduleDisplayName(moduleId) || moduleId}
      onBack={handleBack}
    />
  );
};


// ─── Portal page (generic modules) ──────────────────────────────────────────

const PortalMessage = ({ title, text, action }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
    <h2 className="font-display text-3xl font-semibold text-[var(--text-main)] mb-3 tracking-tight">{title}</h2>
    <p className="text-[var(--text-muted)] max-w-md text-sm">{text}</p>
    {action}
  </div>
);

// /org/<tenant>/<service> for an organisation's service, /tools/<id> for a
// team-only tool. The URL is checked against the session before anything
// renders, so one organisation's page never opens with another's sign-in.
const PortalPage = () => {
  const navigate = useNavigate();
  const { tenant, moduleId: moduleFromUrl } = useParams();
  const moduleId = canonicalModuleId(moduleFromUrl);
  const isToolRoute = !tenant;
  useEffect(() => { if (moduleId) sessionStorage.setItem('fi_module', moduleId); }, [moduleId]);

  const handleSignOut = () => {
    if (isToolRoute) { clearTeamSession(); navigate('/'); return; }
    clearTenantSession();
    navigate(`${paths.orgLogin(tenant)}?next=${encodeURIComponent(moduleId || '')}`);
  };
  // Back: a Smallholder service to the Smallholder hub, otherwise the hub it
  // was opened from (the organisation hub, or the team hub for the team).
  const handleBackToHub = () => navigate(
    SMALLHOLDER_SERVICES.includes(moduleId) && tenant ? paths.service('smallholder-hub', tenant) : backHub(tenant),
  );

  if (!moduleId) return <Navigate to="/" replace />;
  const team = hasValidTeamSession();
  const preMod = resolveModule(moduleId);
  // Each kind of page has one address: tools under /tools, services under /org.
  if (moduleFromUrl !== moduleId || (preMod?.teamOnly && !isToolRoute) || (preMod && !preMod.teamOnly && isToolRoute)) {
    return <Navigate to={paths.service(moduleId, tenant || sessionTenant())} replace />;
  }
  if (isToolRoute && !team) return <Navigate to="/" replace />;
  if (!isToolRoute && sessionTenant() !== tenant) {
    return <Navigate to={`${paths.orgLogin(tenant)}?next=${encodeURIComponent(moduleId)}`} replace />;
  }

  const backButton = (label, onClick) => (
    <button onClick={onClick} className="mt-8 px-6 py-3 bg-white text-[var(--text-main)] border border-[var(--border-light)] rounded-xl font-semibold text-sm hover:bg-[var(--bg-main)] transition-colors">{label}</button>
  );
  const exitAction = backButton(isToolRoute ? 'Back to hub' : 'Back to your services', () => navigate(isToolRoute ? '/' : paths.orgHub(tenant)));

  const mod = resolveModule(moduleId);
  if (!mod) {
    return <PortalMessage title="Not available" text="This link does not open a FarmIntelytics service." action={exitAction} />;
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
    content = <CropPortal moduleId={moduleId} {...props} />;
  } else if (mod.kind === 'suitability') {
    content = <SuitabilityPortal {...props} />;
  } else if (mod.kind === 'smallholder') {
    content = <SmallholderHub {...props} />;
  } else {
    content = <ServicePortal moduleId={moduleId} {...props} />;
  }
  return <ErrorBoundary key={moduleId}>{content}</ErrorBoundary>;
};


// ─── Root App ────────────────────────────────────────────────────────────────
const App = () => (
  <>
    <AdminActivity />
    <AppRoutes />
  </>
);

const AppRoutes = () => {
  // In restricted mode, always start at /login regardless of entered URL
  if (RESTRICTED_MODULE) {
    return (
      <React.Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/org/:tenant/login" element={<LoginPage />} />
          <Route path="/org/:tenant/:moduleId" element={<PortalPage />} />
          {/* Redirect everything else to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/"                         element={<HubPage />} />
        <Route path="/login"                    element={<LoginPage />} />
        <Route path="/f/:token"                 element={<PublicFormPage />} />
        <Route path="/tools/:moduleId"          element={<PortalPage />} />
        <Route path="/org/:tenant"              element={<OrgPage view="services" />} />
        <Route path="/org/:tenant/settings"     element={<OrgPage view="settings" />} />
        <Route path="/org/:tenant/field"        element={<OrgPage view="field" />} />
        {/* The installed phone app opens here: the signed-in organisation's Field page. */}
        <Route path="/field"                    element={<Navigate to={sessionTenant() ? paths.orgField(sessionTenant()) : '/login'} replace />} />
        <Route path="/org/:tenant/login"        element={<LoginPage />} />
        <Route path="/org/:tenant/:moduleId"    element={<PortalPage />} />
        {/* Old addresses */}
        <Route path="/hub"                      element={<Navigate to="/" replace />} />
        <Route path="/tenant/hub"               element={<LegacyTenantHub />} />
        <Route path="/portal/:moduleId"         element={<LegacyPortal />} />
        <Route path="/portal"                   element={<Navigate to="/" replace />} />
        <Route path="/admin/login"            element={<AdminLogin />} />
        <Route path="/admin/*"               element={<AdminPortal />} />
        {/* Catch-all: back to hub */}
        <Route path="*"                       element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default App;
