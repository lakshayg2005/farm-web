export interface GeoResult {
  name: string
  lat: number
  lng: number
  village?: string
  district?: string
  state?: string
}

/** Place search through OpenStreetMap Nominatim (free, no key). Biased to India; keep requests occasional. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&countrycodes=in&q=${encodeURIComponent(q)}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Place search failed (${response.status})`)
  const rows = (await response.json()) as {
    display_name: string
    lat: string
    lon: string
    address?: Record<string, string>
  }[]
  return rows.map((r) => ({
    name: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    village: r.address?.village ?? r.address?.hamlet ?? r.address?.suburb ?? r.address?.town ?? r.address?.city,
    district: r.address?.state_district ?? r.address?.county ?? r.address?.city ?? r.address?.town,
    state: r.address?.state,
  }))
}
