# farm-web

Website for the Farm Platform, built by **Team 2**. One React app with role-based sections: farmers (V1 produce listings and orders, V2 plots and reservations), customers (V2 plot search and reservation), quality inspectors and admins.

All data comes from the shared backend ([farm-backend](https://github.com/lakshayg2005/farm-backend)) through the API gateway at `/api/v1`.
The typed API client is generated from the backend's OpenAPI specs (`pnpm gen:api`), and a mock server built from the same specs (`pnpm mock`) lets screens be built before a service is ready.

## Stack

React 18 + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS, React-Leaflet (+ leaflet-draw), Vitest + Playwright, pnpm.

## Layout

```text
src/
  api/          generated client + query hooks
  features/     farmer/, customer/, inspector/, admin/, auth/, team/
  components/   shared UI
  routes/       route definitions and role guards
```

## End-to-end tests

`pnpm e2e` runs Playwright journeys for every role against a real stack with the curated demo data
(`scripts/reset-demo.sh` in farm-backend; logins in its `docs/DEMO.md`). It builds the app and serves it on
`http://localhost:4173` (an origin the gateway allows), API from `VITE_API_BASE_URL`. Against a deployed site:
`E2E_BASE_URL=http://10.1.75.79:3501 pnpm e2e`. First time: `pnpm exec playwright install chromium`.
Every test fails on a console error, an uncaught exception or a 5xx answer; `responsive.spec.ts` visits every page at
390 px and 1440 px, checks nothing scrolls sideways and leaves screenshots in `e2e/screenshots/`.
`pnpm test` is unit tests only.

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

Colours and fonts are Tailwind theme tokens in `src/index.css`: `paper`, `paper-deep`, `ink`, `ink-soft`, `line`, and one colour per section
(`mustard` farmer, `indigo` customer, `leaf` inspector, `soil` admin). Headings use `font-display` (Young Serif); body text uses Mukta,
which also covers Devanagari. Inside a section the CSS variable `--role` holds the section colour.
Animations use Motion (`motion/react`) and respect the reduced-motion setting through `MotionConfig`.
