/**
 * Leaflet and the polygon drawing tool ship with the app instead of coming from a CDN, so maps work on
 * any network. Leaflet sets `window.L` itself and leaflet-draw extends it; `getLeaflet()` reads that global.
 */
import 'leaflet'
import 'leaflet-draw'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
