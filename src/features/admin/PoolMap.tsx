import { useEffect, useRef } from 'react'
import { getLeaflet, type LeafletLayer, type LeafletMapLike } from '@/features/customer/leaflet'
import { orderedStops, type Pool } from './admin'

/** The part of Leaflet this map needs on top of the shared typing: round stop markers. */
interface PoolLeaflet {
  circleMarker(latlng: [number, number], options: Record<string, unknown>): LeafletLayer
}

interface PoolFeature {
  type: 'Feature'
  id: string
  properties: { kind?: 'PICKUP' | 'DROP'; sequence?: number }
  geometry: unknown
}

/** Draws each pool's route and its pickups (mustard) and drops (primary) on an OpenStreetMap map. */
export function PoolMap({ pools, selectedId }: { pools: Pool[]; selectedId: string | null }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMapLike | null>(null)
  const layer = useRef<LeafletLayer | null>(null)

  useEffect(() => {
    const L = getLeaflet()
    if (!el.current || !L) return
    const m = L.map(el.current).setView([22.5, 79], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
      layer.current = null
    }
  }, [])

  useEffect(() => {
    const L = getLeaflet()
    const m = map.current
    if (!L || !m) return
    layer.current?.remove()
    const features: PoolFeature[] = pools.flatMap((pool) => [
      ...(pool.route ? [{ type: 'Feature' as const, id: pool.id, properties: {}, geometry: pool.route }] : []),
      ...orderedStops(pool).map((s) => ({
        type: 'Feature' as const,
        id: pool.id,
        properties: { kind: s.kind, sequence: s.sequence },
        geometry: s.location,
      })),
    ])
    const dim = (id?: string) => selectedId !== null && id !== selectedId
    const geo = L.geoJSON({ type: 'FeatureCollection', features }, {
      style: (f) => ({
        color: f?.id === selectedId ? '#1c2620' : '#2e3a87',
        weight: f?.id === selectedId ? 5 : 3,
        opacity: dim(f?.id) ? 0.25 : 0.9,
      }),
      pointToLayer: (f: PoolFeature, latlng: [number, number]) =>
        (L as unknown as PoolLeaflet).circleMarker(latlng, {
          radius: f.properties.kind === 'PICKUP' ? 7 : 6,
          color: '#ffffff',
          weight: 2,
          fillColor: f.properties.kind === 'PICKUP' ? '#d9a404' : '#2e3a87',
          fillOpacity: dim(f.id) ? 0.3 : 1,
        }),
    } as Parameters<typeof L.geoJSON>[1]).addTo(m)
    layer.current = geo
    if (features.length > 0 && geo.getBounds) m.fitBounds(geo.getBounds(), { padding: [30, 30], maxZoom: 13, animate: false })
  }, [pools, selectedId])

  return (
    <div
      ref={el}
      className="isolate h-80 w-full rounded-xl border border-line bg-paper-deep lg:h-[30rem]"
      role="region"
      aria-label="Map of delivery pools: pickups in yellow, deliveries in blue"
    />
  )
}
