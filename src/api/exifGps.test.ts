import { describe, expect, it } from 'vitest'
import { findTiff, gpsFromTiff, readPhotoGps } from './exifGps'
import { photoBadge, photoLocationHint, type Media } from './media'

/** A minimal big-endian TIFF/EXIF block with a GPS IFD: lat/lng as degrees, minutes, seconds. */
function tiffWithGps(lat: [number, number, number], latRef: string, lng: [number, number, number], lngRef: string) {
  const buf = new ArrayBuffer(128)
  const v = new DataView(buf)
  v.setUint16(0, 0x4d4d) // "MM"
  v.setUint16(2, 42)
  v.setUint32(4, 8) // IFD0
  v.setUint16(8, 1)
  v.setUint16(10, 0x8825) // GPS IFD pointer
  v.setUint16(12, 4)
  v.setUint32(14, 1)
  v.setUint32(18, 26)
  v.setUint32(22, 0)
  // GPS IFD at 26: 4 entries, rationals at 80 (lat) and 104 (lng)
  v.setUint16(26, 4)
  const entry = (i: number, tag: number, type: number, count: number, value: number) => {
    const at = 28 + i * 12
    v.setUint16(at, tag)
    v.setUint16(at + 2, type)
    v.setUint32(at + 4, count)
    v.setUint32(at + 8, value)
  }
  entry(0, 1, 2, 2, latRef.charCodeAt(0) << 24)
  entry(1, 2, 5, 3, 80)
  entry(2, 3, 2, 2, lngRef.charCodeAt(0) << 24)
  entry(3, 4, 5, 3, 104)
  v.setUint32(76, 0)
  const rationals = (at: number, [d, m, s]: [number, number, number]) => {
    ;[d, m, Math.round(s * 100)].forEach((n, i) => {
      v.setUint32(at + i * 8, n)
      v.setUint32(at + i * 8 + 4, i === 2 ? 100 : 1)
    })
  }
  rationals(80, lat)
  rationals(104, lng)
  return new Uint8Array(buf)
}

/** A JPEG whose APP1 segment holds [tiff]. */
function jpegWith(tiff: Uint8Array) {
  const head = [0xff, 0xd8, 0xff, 0xe1, ...u16(2 + 6 + tiff.length), ...[...'Exif'].map((c) => c.charCodeAt(0)), 0, 0]
  return new Uint8Array([...head, ...tiff, 0xff, 0xd9])
}
const u16 = (n: number) => [n >> 8, n & 0xff]

describe('reading the camera location of a photo', () => {
  it('finds GPS in a JPEG taken by a phone camera', async () => {
    const jpeg = jpegWith(tiffWithGps([21, 11, 24], 'N', [81, 17, 6], 'E'))
    const point = gpsFromTiff(findTiff(jpeg)!)!
    expect(point.lat).toBeCloseTo(21.19, 4)
    expect(point.lng).toBeCloseTo(81.285, 4)
    expect(await readPhotoGps(new Blob([jpeg], { type: 'image/jpeg' }))).not.toBeNull()
  })

  it('applies south and west', () => {
    const p = gpsFromTiff(findTiff(jpegWith(tiffWithGps([33, 51, 0], 'S', [151, 12, 0], 'W')))!)!
    expect(p.lat).toBeLessThan(0)
    expect(p.lng).toBeLessThan(0)
  })

  it('says "no location" for screenshots, downloads and (0, 0) fixes', async () => {
    // a PNG screenshot: signature, IHDR, IEND, no eXIf chunk
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0, 0, 0, 0])
    expect(await readPhotoGps(new Blob([png]))).toBeNull()
    // a JPEG with no EXIF segment (what most sites serve)
    expect(findTiff(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))).toBeNull()
    expect(gpsFromTiff(findTiff(jpegWith(tiffWithGps([0, 0, 0], 'N', [0, 0, 0], 'E')))!)).toBeNull()
    expect(await readPhotoGps(new Blob([new Uint8Array([1, 2, 3])]))).toBeNull()
  })
})

const MEDIA = (extra: Partial<Media>): Media => ({
  id: 'm', ownerType: 'LISTING', ownerId: 'l1', status: 'READY', url: 'u', thumbUrl: 't',
  isGeoVerified: true, geoStatus: 'VERIFIED', distanceM: 120, exifTime: null, rejectReason: null, createdAt: '2026-11-24T00:00:00Z',
  ...extra,
})

describe('photo badges', () => {
  it('is Verified only when the camera location matches the farm', () => {
    expect(photoBadge(MEDIA({})).label).toBe('Verified')
    expect(photoBadge(MEDIA({ isGeoVerified: false, geoStatus: 'TOO_FAR', distanceM: 4200 })).detail).toBe('Taken 4.2 km from the farm, not at it.')
    const noGps = photoBadge(MEDIA({ isGeoVerified: false, geoStatus: 'NO_GPS', distanceM: null }))
    expect(noGps.label).toBe('Unverified')
    expect(noGps.detail).toContain('screenshot')
    expect(photoBadge(MEDIA({ isGeoVerified: false, geoStatus: 'NO_REFERENCE', ownerType: 'PLOT' })).detail).toContain('plot’s location is not set')
    expect(photoBadge(MEDIA({ status: 'PROCESSING', url: null, thumbUrl: null })).label).toBe('Checking')
  })

  it('warns before upload when a photo has no location', () => {
    expect(photoLocationHint(undefined)).toBeNull()
    expect(photoLocationHint(true)?.ok).toBe(true)
    expect(photoLocationHint(false)?.text).toContain('Unverified')
  })
})
