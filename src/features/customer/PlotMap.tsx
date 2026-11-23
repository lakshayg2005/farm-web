import { useEffect, useRef } from 'react'
import type { Bounds, PlotFeature } from './land'
import { getLeaflet, type LeafletLayer, type LeafletMapLike } from './leaflet'

interface Props {
  plots: PlotFeature[]
  selectedId: string | null
  onSelect: (plotId: string) => void
  onBoundsChange: (bounds: Bounds) => void
  /** Move the map here (a searched place); a new object moves it again */
  focus?: { lat: number; lng: number } | null
}

/** Shows the plots found as outlines on an OpenStreetMap map; reports the visible area when it moves. */
export function PlotMap({ plots, selectedId, onSelect, onBoundsChange, focus }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMapLike | null>(null)
  const layer = useRef<LeafletLayer | null>(null)
  const fitted = useRef(false)
  const onBounds = useRef(onBoundsChange)
  const onPick = useRef(onSelect)
  // Keep the latest callbacks for the map's event handlers without re-creating the map.
  useEffect(() => {
    onBounds.current = onBoundsChange
    onPick.current = onSelect
  })

  useEffect(() => {
    const L = getLeaflet()
    if (!el.current || !L) return
    const m = L.map(el.current).setView([22.5, 79], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    const report = () => {
      const b = m.getBounds()
      onBounds.current({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() })
    }
    m.on('moveend', report)
    map.current = m
    report()
    return () => {
      m.remove()
      map.current = null
      layer.current = null
    }
  }, [])

  useEffect(() => {
    if (!focus || !map.current) return
    fitted.current = true
    map.current.setView([focus.lat, focus.lng], 13)
  }, [focus])

  useEffect(() => {
    const L = getLeaflet()
    const m = map.current
    if (!L || !m) return
    layer.current?.remove()
    const geo = L.geoJSON(
      { type: 'FeatureCollection', features: plots },
      {
        style: (f) => {
          const selected = f?.properties?.plotSeasonId === selectedId
          return { color: selected ? '#ee9800' : '#2ec47a', weight: selected ? 4 : 2, fillOpacity: selected ? 0.45 : 0.25 }
        },
        onEachFeature: (f, l) => l.on({ click: () => f.properties?.plotSeasonId && onPick.current(f.properties.plotSeasonId) }),
      },
    ).addTo(m)
    layer.current = geo
    // The first results zoom the map to them; after that the user is in control of the view.
    if (!fitted.current && plots.length > 0 && geo.getBounds) {
      fitted.current = true
      m.fitBounds(geo.getBounds(), { padding: [30, 30], maxZoom: 14 })
    }
  }, [plots, selectedId])

  return <div ref={el} className="h-80 w-full overflow-hidden rounded-2xl lg:h-[620px]" role="region" aria-label="Map of available plots" />
}
