// pnpm mock   starts Prism for every spec in contracts/ and one gateway on http://localhost:4000
// Point the website at it:  VITE_API_BASE_URL=http://localhost:4000/api/v1 pnpm dev
// The gateway routes /api/v1/<service>/... to that service's Prism, like Traefik does in the real stack.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { readdirSync } from 'node:fs'
import http from 'node:http'

const specs = readdirSync('contracts').filter((f) => f.endsWith('.json'))
if (specs.length === 0) {
  console.error('No specs in contracts/. Run pnpm gen:api first.')
  process.exit(1)
}

const prismEntry = join(dirname(createRequire(import.meta.url).resolve('@stoplight/prism-cli/package.json')), 'dist', 'index.js')
const GATEWAY_PORT = Number(process.env.MOCK_PORT ?? 4000)
const ports = new Map()
const children = []
specs.forEach((file, i) => {
  const service = file.replace('.json', '')
  const port = GATEWAY_PORT + 10 + i
  ports.set(service, port)
  const child = spawn(process.execPath, [prismEntry, 'mock', '-p', String(port), '-h', '127.0.0.1', '--cors', `contracts/${file}`], { stdio: ['ignore', 'inherit', 'inherit'] })
  children.push(child)
})

// Demo sign-in: Prism answers with placeholder values ("string", a token that expires at once), so
// the auth routes get a fixed demo user holding every website role. Any phone and password work.
const DEMO_USER = {
  id: '6f1c2a4e-1d2b-4c3d-9e8f-0a1b2c3d4e5f',
  name: 'Demo User',
  phone: '+919900000000',
  email: null,
  roles: ['farmer', 'customer', 'inspector', 'admin'],
  phoneVerified: true,
  farmerVerified: true,
  homeLat: 21.1904,
  homeLng: 81.2849,
  createdAt: '2026-11-01T00:00:00Z',
}
const tokens = () => ({ accessToken: 'demo-access', refreshToken: 'demo-refresh', tokenType: 'bearer', expiresIn: 3600, user: DEMO_USER })
const DEMO = {
  'POST /identity/login': tokens,
  'POST /identity/register': tokens,
  'POST /identity/refresh': tokens,
  'POST /identity/otp/verify': tokens,
  'GET /identity/me': () => DEMO_USER,
}

const server = http.createServer((req, res) => {
  const demo = DEMO[`${req.method} ${(req.url ?? '').split('?')[0].replace(/^\/api\/v1/, '')}`]
  if (demo) {
    req.resume()
    res.writeHead(req.method === 'POST' && req.url?.includes('register') ? 201 : 200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    return res.end(JSON.stringify(demo()))
  }
  const match = /^\/api\/v1\/([a-z]+)(\/.*)?$/.exec(req.url ?? '')
  const port = match && ports.get(match[1])
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    })
    return res.end()
  }
  if (!port) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: { code: 'not_found', message: 'No mock for this path' } }))
  }
  const upstream = http.request({ host: '127.0.0.1', port, path: match[2] || '/', method: req.method, headers: req.headers }, (up) => {
    res.writeHead(up.statusCode ?? 502, { ...up.headers, 'Access-Control-Allow-Origin': '*' })
    up.pipe(res)
  })
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: { code: 'mock_starting', message: 'Mock server is still starting. Try again.' } }))
  })
  req.pipe(upstream)
})
server.listen(GATEWAY_PORT, () => console.log(`Mock gateway on http://localhost:${GATEWAY_PORT}/api/v1/<service>/…`))

const stop = () => {
  server.close()
  children.forEach((c) => c.kill())
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
