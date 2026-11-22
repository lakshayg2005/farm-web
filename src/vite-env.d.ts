/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API gateway, e.g. http://localhost/api/v1 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface LeafletDrawLayer {
  toGeoJSON(): {
    geometry: { type: 'Polygon'; coordinates: number[][][] }
  }
}

interface LeafletFeatureGroup {
  addLayer(layer: LeafletDrawLayer): void
  clearLayers(): void
}

interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap
  flyTo(center: [number, number], zoom?: number): LeafletMap
  addLayer(layer: LeafletFeatureGroup): void
  addControl(control: unknown): void
  on(eventName: string, handler: (event: { layer: LeafletDrawLayer }) => void): void
  remove(): void
}

interface LeafletNamespace {
  map(element: HTMLElement): LeafletMap
  tileLayer(url: string, options: Record<string, unknown>): { addTo(map: LeafletMap): void }
  FeatureGroup: new () => LeafletFeatureGroup
  Control: { Draw: new (options: Record<string, unknown>) => unknown }
  Draw: { Event: { CREATED: string; DELETED: string } }
}

interface Window {
  L: LeafletNamespace
}
