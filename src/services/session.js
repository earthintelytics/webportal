/**
 * Session storage keys in one place, so signing out never leaves another
 * organisation's module, data or cache behind for the next user.
 */
export const TENANT_KEYS = [
  'fi_token', 'fi_email', 'fi_user', 'fi_tenant', 'fi_role', 'fi_full_name',
  'fi_display_name', 'fi_allowed_modules', 'fi_allowed_crops', 'fi_map_center', 'fi_logo_url', 'fi_max_accounts',
];
export const TEAM_KEYS = ['fi_admin_token', 'fi_admin_email'];

// Per-session navigation state that must not carry over to another account.
const SESSION_KEYS = ['fi_module', 'fi_target_tenant', 'fi_from_hub', 'fi_hub', 'fi_data_needed_snoozed', 'fi_estates_unavailable'];

/** Keys namespaced by tenant (offline caches): `${base}:${tenant}`. */
export const tenantKey = (base) => `${base}:${localStorage.getItem('fi_tenant') || 'none'}`;

export function clearTenantSession() {
  TENANT_KEYS.forEach((k) => localStorage.removeItem(k));
  SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k));
}

export function clearTeamSession() {
  TEAM_KEYS.forEach((k) => localStorage.removeItem(k));
  SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k));
}

/** Before a new sign-in: no account data from a previous user survives (the
 *  module being opened, in sessionStorage, is kept). */
export function clearTenantAccount() {
  TENANT_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function clearTeamAccount() {
  TEAM_KEYS.forEach((k) => localStorage.removeItem(k));
}

/**
 * A client token was refused: drop it and go to that organisation's own
 * sign-in (/org/<tenant>/login), coming back to the same service afterwards.
 */
export function redirectToTenantSignIn() {
  if (typeof window === 'undefined') return;
  const tenant = localStorage.getItem('fi_tenant');
  const path = window.location.pathname;
  const m = path.match(/^\/org\/[^/]+\/([^/]+)$/);
  const next = m && !['settings', 'login'].includes(m[1]) ? `?next=${m[1]}` : '';
  ['fi_token', 'fi_user', 'fi_tenant'].forEach((k) => localStorage.removeItem(k));
  if (path.startsWith('/login') || path.endsWith('/login')) return;
  window.location.href = tenant ? `/org/${encodeURIComponent(tenant)}/login${next}` : '/login';
}

/**
 * A usable team sign-in: a superadmin token issued for the team (aud "team")
 * and not expired. Tokens from before the access update have no audience and
 * are treated as signed out, so the person signs in again instead of seeing
 * "Forbidden".
 */
export function hasValidTeamToken() {
  try {
    const token = localStorage.getItem('fi_admin_token');
    if (!token) return false;
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return p.role === 'superadmin' && p.aud === 'team' && (!p.exp || p.exp * 1000 > Date.now());
  } catch {
    return false;
  }
}

/** The team sign-in was refused or is outdated: clear it and go to the team sign-in. */
export function redirectToTeamSignIn() {
  TEAM_KEYS.forEach((k) => localStorage.removeItem(k));
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
    window.location.href = '/admin/login';
  }
}
