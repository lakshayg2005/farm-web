/** Leaflet is bundled with the app (features/map/leaflet-setup) and exposed as window.L. Only what the search map uses. */
export interface LeafletLayer {
  addTo(map: LeafletMapLike): LeafletLayer
  remove(): void
  getBounds?(): unknown
}

export interface LeafletMapLike {
  setView(center: [number, number], zoom: number): LeafletMapLike
  fitBounds(bounds: unknown, options?: Record<string, unknown>): LeafletMapLike
  getBounds(): { getWest(): number; getSouth(): number; getEast(): number; getNorth(): number }
  on(event: string, handler: () => void): void
  remove(): void
}

/** A plot id repeats for each of its seasons, so features are told apart by plotSeasonId. */
export interface LeafletFeature {
  id?: string
  properties?: { plotSeasonId?: string }
}

export interface LeafletLib {
  map(el: HTMLElement): LeafletMapLike
  tileLayer(url: string, options: Record<string, unknown>): LeafletLayer
  geoJSON(
    data: unknown,
    options?: {
      style?: (feature?: LeafletFeature) => Record<string, unknown>
      onEachFeature?: (feature: LeafletFeature, layer: { on(events: Record<string, () => void>): void }) => void
    },
  ): LeafletLayer
}

export function getLeaflet(): LeafletLib | null {
  return (window as unknown as { L?: LeafletLib }).L ?? null
}
