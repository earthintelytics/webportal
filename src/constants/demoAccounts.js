/**
 * Demo accounts for the "Demo account" buttons on the sign-in pages.
 *
 * Read only from the build setting VITE_DEMO_ACCOUNTS, which is set on the
 * demo server alone (docker-compose.demo.yml → Dockerfile.prod build arg),
 * never in the repo: a production build has no buttons and no passwords.
 *
 *   VITE_DEMO_ACCOUNTS='[{"label":"Okomu","email":"…","code":"…","scope":"tenant"},
 *                        {"label":"Team","email":"…","code":"…","scope":"team"}]'
 *
 * scope "tenant" shows on client and service sign-in pages, "team" on the
 * team / admin sign-in.
 */
function parse() {
  try {
    const list = JSON.parse(import.meta.env.VITE_DEMO_ACCOUNTS || '[]');
    return Array.isArray(list) ? list.filter((a) => a && a.email && a.code) : [];
  } catch {
    return [];
  }
}

const ALL = parse();

export const demoAccounts = (scope) => ALL.filter((a) => (a.scope || 'tenant') === scope);
