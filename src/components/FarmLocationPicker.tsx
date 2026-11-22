import { useEffect, useRef } from 'react'
import { PlaceSearch } from '@/components/PlaceSearch'
import type { GeoResult } from '@/api/geocode'

interface Marker {
  setLatLng(p: [number, number]): Marker
  addTo(m: unknown): Marker
}
interface PickMap {
  setView(c: [number, number], z: number): PickMap
  flyTo(c: [number, number], z?: number): PickMap
  on(e: string, h: (ev: { latlng: { lat: number; lng: number } }) => void): void
  remove(): void
}
interface Lib {
  map(el: HTMLElement): PickMap
  tileLayer(url: string, o: Record<string, unknown>): { addTo(m: PickMap): void }
  marker(p: [number, number]): Marker
}

/** Search an area, then click the map to drop a pin on the farm gate. */
export function FarmLocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number, place?: GeoResult) => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<PickMap | null>(null)
  const pin = useRef<Marker | null>(null)
  const change = useRef(onChange)
  useEffect(() => {
    change.current = onChange
  })

  function drop(la: number, ln: number) {
    const L = (window as unknown as { L?: Lib }).L
    if (!L || !map.current) return
    if (pin.current) pin.current.setLatLng([la, ln])
    else pin.current = L.marker([la, ln]).addTo(map.current)
  }

  useEffect(() => {
    const L = (window as unknown as { L?: Lib }).L
    if (!L || !el.current) return
    const m = L.map(el.current).setView(lat != null && lng != null ? [lat, lng] : [20.5937, 78.9629], lat != null ? 14 : 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(m)
    map.current = m
    if (lat != null && lng != null) drop(lat, lng)
    m.on('click', (ev) => {
      const ln = ((((ev.latlng.lng + 180) % 360) + 360) % 360) - 180
      drop(ev.latlng.lat, ln)
      change.current(Number(ev.latlng.lat.toFixed(5)), Number(ln.toFixed(5)))
    })
    return () => {
      map.current = null
      pin.current = null
      m.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-2 sm:col-span-2">
      <PlaceSearch
        onPick={(r) => {
          map.current?.flyTo([r.lat, r.lng], 15)
          drop(r.lat, r.lng)
          onChange(Number(r.lat.toFixed(5)), Number(r.lng.toFixed(5)), r)
        }}
      />
      <div ref={el} className="h-[320px] w-full overflow-hidden rounded-lg border border-line" />
      <p className="text-xs text-ink-soft">Search your area, then click the map to place the pin on your farm gate.</p>
    </div>
  )
}
