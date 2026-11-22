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
  crops: string | string[],
): SeasonInput {
  return {
    season: season.trim(),
    startDate,
    endDate,
    price: Number(price),
    allowedCrops: (Array.isArray(crops) ? crops : crops.split(',')).map((crop) => crop.trim()).filter(Boolean),
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

export type SeasonProblemInput = { startDate: string; endDate: string; price: string }

/** Checks a season the way the land service does, so the farmer sees the problem before sending. */
export function seasonProblem({ startDate, endDate, price }: SeasonProblemInput): string | null {
  if (!startDate || !endDate) return 'Choose when the season starts and ends.'
  if (endDate <= startDate) return 'The season must end after it starts.'
  if (!(Number(price) > 0)) return 'Enter the price per kg of harvest, in rupees.'
  return null
}
