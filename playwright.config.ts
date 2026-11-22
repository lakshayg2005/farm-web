import { defineConfig, devices } from '@playwright/test'

/**
 * Journeys against a real stack with the demo data (backend: scripts/reset-demo.sh, logins in docs/DEMO.md).
 *   pnpm e2e                                  builds and serves the app on :4173, API from VITE_API_BASE_URL (.env)
 *   E2E_BASE_URL=http://10.1.75.79:3501 pnpm e2e   against an already deployed site (no local server)
 * The gateway only allows the origins in infra/traefik/dynamic.yml, which includes http://localhost:4173.
 */
const external = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: './e2e/report' }]],
  use: {
    baseURL: external ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: external
    ? undefined
    : { command: 'pnpm build && pnpm exec vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120_000 },
})
