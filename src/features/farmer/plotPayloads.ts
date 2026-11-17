export type Polygon = { type: 'Polygon'; coordinates: number[][][] }
type SeasonInput = {
  season: string
  startDate: string
  endDate: string
  price: number
  allowedCrops: string[]
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
    boundary,
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
