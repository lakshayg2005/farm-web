# farm-web

Website for the Farm Platform, built by **Team 2**. One React app with a workspace per role: farmers (produce listings and orders, plots, reservation requests, crop updates, earnings), customers (shop, cart, orders, land search and reservations) and admins (dashboard, orders, farmer verification, people, delivery pooling). The start page is the sign-in form; delivery partners use the app.

All data comes from the shared backend ([farm-backend](https://github.com/lakshayg2005/farm-backend)) through the API gateway at `/api/v1`.
The typed API client is generated from the backend's OpenAPI specs (`pnpm gen:api`), and a mock server built from the same specs (`pnpm mock`) lets screens be built before a service is ready.

## Links

| What | URL |
| --- | --- |
| Website, team VM | <https://10.1.75.79:3501> (college network or VPN; self-signed certificate, accept the browser warning) |
| API gateway, team VM | <http://10.1.75.79:4501/api/v1> (the website itself calls it same-origin at `https://10.1.75.79:3501/api/v1`) |
| Website, local | <http://localhost:5173> (`pnpm dev`) |
| API gateway, local | <http://localhost/api/v1> (`docker compose up -d` in farm-backend) |
| Demo logins for every role | [farm-backend/docs/DEMO.md](https://github.com/lakshayg2005/farm-backend/blob/main/docs/DEMO.md) |
| Demo walkthrough | [farm-backend/docs/DEMO-SCRIPT.md](https://github.com/lakshayg2005/farm-backend/blob/main/docs/DEMO-SCRIPT.md) |
| Backend repo | <https://github.com/lakshayg2005/farm-backend> |
| Apps repo (Kotlin in `android/`) | <https://github.com/lakshayg2005/farm-mobile> |

## Stack

React 18 + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS, React-Leaflet (+ leaflet-draw), Vitest + Playwright, pnpm.

## Layout

```text
src/
  api/          generated client + query hooks
  features/     farmer/, customer/, shop/, admin/, auth/, notifications/, team/
  components/   shared UI
  routes/       route definitions and role guards
```

## End-to-end tests

`pnpm e2e` runs Playwright journeys for every role against a real stack with the curated demo data
(`scripts/reset-demo.sh` in farm-backend; logins in its `docs/DEMO.md`). It builds the app and serves it on
`http://localhost:4173` (an origin the gateway allows), API from `VITE_API_BASE_URL`. Against a deployed site:
`E2E_BASE_URL=https://10.1.75.79:3501 pnpm e2e`. First time: `pnpm exec playwright install chromium`.
Every test fails on a console error, an uncaught exception or a 5xx answer; `responsive.spec.ts` visits every page at
390 px and 1440 px, checks nothing scrolls sideways and leaves screenshots in `e2e/screenshots/`.
`pnpm test` is unit tests only.

## Deploying to the team VM

The site is a static build served by nginx on the VM (no Docker, no systemd there). Needs the college network or VPN;
SSH uses key auth as `student` on port 2501 with passwordless sudo.

| What | Value |
| --- | --- |
| SSH | `ssh -p 2501 student@10.1.75.79` |
| nginx | `/etc/nginx/sites-enabled/farm-web`: HTTPS on port 3000 (self-signed cert in `/etc/nginx/certs/`), exposed as `:3501` |
| Web root | `/var/www/farm-web` |
| Staging dir | `~/farm-web-dist` |
| API | nginx proxies `/api/` to `127.0.0.1:4000`, so the build calls the same origin |

```bash
VITE_API_BASE_URL=/api/v1 pnpm build        # same-origin API: an https page cannot call the http gateway
rsync -az --delete -e "ssh -p 2501" dist/ student@10.1.75.79:farm-web-dist/
ssh -p 2501 student@10.1.75.79 'sudo rsync -a --delete ~/farm-web-dist/ /var/www/farm-web/'
```

nginx serves new files without a restart. Reload (`sudo nginx -s reload`) only after changing its config, and check
`sudo nginx -t` first: a reload also applies any pending config edit. Check the result with `E2E_BASE_URL=https://10.1.75.79:3501 pnpm e2e`.

## Workflow (all repos)

- `main` is protected: changes go in only through a pull request with 1 approval.
- One issue per branch: `feat/<area>-<short-name>` or `fix/<area>-<short-name>`. Merge within 2 to 3 days.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- Squash-merge PRs and write `Closes #<issue>` in the PR description.
- Never commit `.env`; copy `.env.example` instead.
- Issues are labelled by team (`team-app` = Team 1, `team-web` = Team 2, `team-joint`) and by member slot (`M1`–`M4` Team 1, `M5`–`M8` Team 2). Pick your slot and assign yourself.

## Getting started

Needs Node 22.13+ and pnpm 9 (`corepack enable` picks the version from `package.json`).

```bash
pnpm install
cp .env.example .env      # VITE_API_BASE_URL points at the API gateway
pnpm dev                  # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server with hot reload |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm test` | Vitest (jsdom + Testing Library) |
| `pnpm build` | Type-check and production build into `dist/` |
| `pnpm gen:api [ref]` | Download the backend's OpenAPI specs into `contracts/` and generate types in `src/api/generated/` |
| `pnpm mock` | Prism mock of every service behind one gateway on `localhost:4000` |

CI runs lint, type-check, tests and build on every pull request. Vercel builds a preview of every pull request from `vercel.json`.

### API types and the mock server

The backend publishes one OpenAPI spec per service (`farm-backend/contracts/openapi`). `pnpm gen:api` copies them from the `main` branch (or a tag: `pnpm gen:api v0.2.0`; or a local checkout: `pnpm gen:api --local ../farm-backend/contracts/openapi`) and writes types to `src/api/generated/`. Import them with `import type { OrderComponents } from '@/api/generated'`. Commit the result, and re-run it when a contract changes.

To build a screen before its service exists, run `pnpm mock` and point the website at it:

```bash
pnpm mock                                                  # terminal 1
VITE_API_BASE_URL=http://localhost:4000/api/v1 pnpm dev    # terminal 2
```

The mock returns the examples in each spec, so data is placeholder text and numbers. Set `MOCK_PORT` to use another port.

### Sections and pages

Every role section lives at `/<role>/<page>` and shares one layout shell (left rail on desktop, bottom tab bar on mobile).
Each section's pages are declared in `src/features/<role>/section.ts`. Until a page has its own component it shows an empty state.
To build a page, create the component in `src/features/<role>/` and set it as that page's `element`:

```ts
// src/features/farmer/section.ts
{ path: 'listings', label: 'Listings', icon: 'tag', summary: '...', empty: { ... }, element: <ListingsPage /> }
```

(rename the file to `section.tsx` when it starts holding JSX). Role guards (issue #3) wrap each section's layout in `src/routes/routes.tsx`.

### Design tokens

Colours and fonts are Tailwind theme tokens in `src/index.css`: a warm paper background, one green accent (`primary`) and an
amber for warnings (`secondary`). Light is the default; `html.dark` switches the same names to the dark set. Pages use the names
(`surface-card`, `on-surface`, `on-surface-variant`, `border`, `primary`, …), never raw colours. Text is Instrument Sans; page
titles (`font-serif`) use Instrument Serif; Mukta covers Devanagari. All fonts are bundled, no font CDN. Shared controls are the
`btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `input` and `card` utilities. No emoji or icon font: the few icons are
the SVGs in `src/components/Icon.tsx`. Animations use Motion (`motion/react`) and respect reduced motion through `MotionConfig`.

## Deploying

**Netlify (website).** `netlify.toml` holds the build settings: `pnpm build`, publish `dist`, and
a catch-all redirect so routes like `/farmer/listings` work on reload. In Netlify, set the environment
variable `VITE_API_BASE_URL` to the deployed API gateway (for example
`https://<backend>.onrender.com/api/v1`). The backend gateway must allow the Netlify origin in its
CORS list (`farm-backend/infra/traefik/dynamic.yml`, `accessControlAllowOriginList`).

## Produce catalog

*Customer → Shop* lists what farmers near a chosen place are selling (`GET /catalog/listings/search`). Each listing shows:

- **Freshness**: days since harvest (today, yesterday, n days ago), green up to 3 days and amber up to 7.
- **Low stock** when 10 units or fewer are left.
- Price, stock, organic, distance, the farm and its rating.

The logic is in `src/features/shop/shop.ts` (tested in `shop.test.ts`).
