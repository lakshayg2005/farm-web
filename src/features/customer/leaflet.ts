/** Leaflet is loaded from a script tag in index.html (window.L). Only what the search map uses. */
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

export interface LeafletLib {
  map(el: HTMLElement): LeafletMapLike
  tileLayer(url: string, options: Record<string, unknown>): LeafletLayer
  geoJSON(
    data: unknown,
    options?: {
      style?: (feature?: { id?: string }) => Record<string, unknown>
      onEachFeature?: (feature: { id?: string }, layer: { on(events: Record<string, () => void>): void }) => void
    },
  ): LeafletLayer
}

export function getLeaflet(): LeafletLib | null {
  return (window as unknown as { L?: LeafletLib }).L ?? null
}
