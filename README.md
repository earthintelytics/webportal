# FarmIntelytics web portal

React 19 + Vite portal with two entry points: the **tenant portal** (crop monitoring dashboard, alerts and scouting, reports, AI assistant) and the **super-admin portal** (`/admin`: organisations, farms, onboarding, credentials, users, scheduler, logs).

Conventions (component layout, tokens, API client) are in the root repo's [`docs/DEVELOPMENT.md`](../docs/DEVELOPMENT.md).

## Layout

| Path | Contents |
| --- | --- |
| `src/pages/` | Login and portal hub |
| `src/modules/monitoring/` | Crop monitoring dashboard (the part wired to live data) |
| `src/modules/*` | Management, finance, cooperative, advisor, sustainability portals (sample data — see `docs/FINDINGS.md`, W1) |
| `src/farmintelytics-admin/` | Super-admin portal |
| `src/services/` | API clients (base URL, auth, 401 redirect) |
| `src/index.css`, `tailwind.config.js` | Design tokens, including `--status-*` for live and severity colours |

## Run

```bash
npm install
npm run dev          # http://localhost:5173, API from VITE_API_BASE_URL (defaults to same origin in builds)
npm run build        # production bundle; Dockerfile.prod + nginx.prod.conf serve it
npm run lint
```
