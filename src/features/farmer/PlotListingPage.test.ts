import { describe, expect, it } from 'vitest'
import {
  mediaUploadPayload,
  plotCreatePayload,
  seasonCreatePayload,
} from './plotPayloads'

describe('plot listing API payloads', () => {
  const boundary = {
    type: 'Polygon' as const,
    coordinates: [[[81, 21], [81.1, 21], [81.1, 21.1], [81, 21.1], [81, 21]]],
  }

  it('uses the camelCase plot contract and normalizes optional values', () => {
    expect(plotCreatePayload(' North field ', ' Black soil ', ' ', boundary)).toEqual({
      title: 'North field',
      soilType: 'Black soil',
      waterSource: null,
      boundary,
    })
  })

  it('uses the camelCase season contract and splits allowed crops', () => {
    expect(seasonCreatePayload(' Kharif ', '2026-06-01', '2026-10-01', '12000', 'rice, maize, ')).toEqual({
      season: 'Kharif',
      startDate: '2026-06-01',
      endDate: '2026-10-01',
      price: 12000,
      allowedCrops: ['rice', 'maize'],
    })
  })

  it('uses the camelCase media upload contract', () => {
    expect(mediaUploadPayload('plot-1', 'image/jpeg', 1024, 'field.jpg')).toEqual({
      ownerType: 'PLOT',
      ownerId: 'plot-1',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
      fileName: 'field.jpg',
    })
  })
})
