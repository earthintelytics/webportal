/**
 * Every portal URL is built here, so paths stay predictable:
 *
 *   /                          team hub (FarmIntelytics team)
 *   /admin/...                 admin console (team)
 *   /tools/<id>                team-only tools (Crop suitability)
 *   /org/<tenant>              an organisation's hub: its licensed services
 *   /org/<tenant>/settings     organisation settings: team, logo, password
 *   /org/<tenant>/login        organisation sign-in
 *   /org/<tenant>/<service>    a service, e.g. /org/olam/rs-cocoa
 *   /login?module=<service>    sign-in from a service link (organisation not known yet)
 *   /f/<token>                 public form link (no account)
 *
 * Old URLs (/tenant/hub, /portal/<id>, /login?tenant=) redirect to these.
 */
import { resolveModule, canonicalModuleId } from '../modules/registry';

const enc = encodeURIComponent;

export const paths = {
  teamHub: '/',
  orgHub: (tenant) => `/org/${enc(tenant)}`,
  orgSettings: (tenant) => `/org/${enc(tenant)}/settings`,
  orgField: (tenant) => `/org/${enc(tenant)}/field`,
  orgLogin: (tenant) => `/org/${enc(tenant)}/login`,
  serviceLogin: (id) => `/login?module=${enc(id)}`,
  tool: (id) => `/tools/${enc(id)}`,
  /** A service for an organisation; team-only tools have their own place. */
  service: (id, tenant) => {
    const mod = resolveModule(id);
    const cid = canonicalModuleId(id);
    if (mod?.teamOnly) return `/tools/${enc(cid)}`;
    return tenant ? `/org/${enc(tenant)}/${enc(cid)}` : `/login?module=${enc(cid)}`;
  },
};

/** The organisation signed in on this browser, or null. */
export function sessionTenant() {
  try {
    const token = localStorage.getItem('fi_token');
    const tenant = localStorage.getItem('fi_tenant');
    return token && tenant ? tenant : null;
  } catch {
    return null;
  }
}

/** URL of a service for whoever is signed in. */
export const serviceUrl = (id) => paths.service(id, sessionTenant());
