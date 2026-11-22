export type Polygon = { type: 'Polygon'; coordinates: number[][][] }
type SeasonInput = {
  season: string
  startDate: string
  endDate: string
  price: number
  allowedCrops: string[]
}

/** Leaflet keeps counting longitude past 180 when the map is dragged round the world; fold it back. */
export function wrapLng(lng: number) {
  if (lng >= -180 && lng <= 180) return lng
  return ((((lng + 180) % 360) + 360) % 360) - 180
}

export function normalizeBoundary(boundary: Polygon): Polygon {
  return {
    type: 'Polygon',
    coordinates: boundary.coordinates.map((ring) => ring.map(([lng, lat]) => [wrapLng(lng as number), lat as number])),
  }
}

export function plotCreatePayload(
  title: string,
  soilType: string,
  waterSource: string,
  boundary: Polygon,
) {
  return {
    title: title.trim(),
    soilType: soilType.trim() || null,
    waterSource: waterSource.trim() || null,
    boundary: normalizeBoundary(boundary),
  }
}

export function seasonCreatePayload(
  season: string,
  startDate: string,
  endDate: string,
  price: string,
  crops: string,
): SeasonInput {
  return {
    season: season.trim(),
    startDate,
    endDate,
    price: Number(price),
    allowedCrops: crops.split(',').map((crop) => crop.trim()).filter(Boolean),
  }
}

export function mediaUploadPayload(
  plotId: string,
  contentType: string,
  sizeBytes: number,
  fileName: string,
) {
  return { ownerType: 'PLOT', ownerId: plotId, contentType, sizeBytes, fileName }
}
