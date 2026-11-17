import { useEffect, useRef } from 'react'
import { getLeaflet, type LeafletLayer, type LeafletMapLike } from '@/features/customer/leaflet'
import type { Pool } from './admin'

/** Draws each pool's route and stops on an OpenStreetMap map and zooms to fit them. */
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
    const features = pools.flatMap((pool) => [
      ...(pool.route ? [{ type: 'Feature', id: pool.id, properties: {}, geometry: pool.route }] : []),
      ...pool.stops.map((s) => ({ type: 'Feature', id: pool.id, properties: {}, geometry: s.location })),
    ])
    const geo = L.geoJSON(
      { type: 'FeatureCollection', features },
      {
        style: (f) => ({ color: f?.id === selectedId ? '#d9a404' : '#2e3a87', weight: f?.id === selectedId ? 5 : 3 }),
      },
    ).addTo(m)
    layer.current = geo
    if (features.length > 0 && geo.getBounds) m.fitBounds(geo.getBounds(), { padding: [30, 30], maxZoom: 13 })
  }, [pools, selectedId])

  return <div ref={el} className="h-80 w-full rounded-xl border border-line lg:h-[30rem]" role="region" aria-label="Map of delivery pools" />
}
