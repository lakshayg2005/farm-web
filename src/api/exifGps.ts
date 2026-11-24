/**
 * Reads the GPS position a camera wrote into a photo, in the browser, before it is uploaded.
 *
 * The media service decides "Verified" on the server from the same EXIF data (its GPS point must
 * lie near the farm or plot). This is only so the form can say up front that a photo has no
 * location — a screenshot, an edited or a downloaded image — and will therefore show as
 * Unverified. Handles EXIF in JPEG (APP1), PNG (eXIf chunk) and WebP (EXIF chunk).
 */

export interface GpsPoint {
  lat: number
  lng: number
}

const GPS_IFD_POINTER = 0x8825

/** The TIFF block holding EXIF, or null when the file carries none. */
export function findTiff(bytes: Uint8Array): DataView | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (at: number, n: number) => String.fromCharCode(...bytes.subarray(at, at + n))

  // JPEG: segments after FFD8; EXIF lives in APP1 starting "Exif\0\0".
  if (bytes.length > 4 && view.getUint16(0) === 0xffd8) {
    let at = 2
    while (at + 4 <= bytes.length && bytes[at] === 0xff) {
      const marker = bytes[at + 1]
      if (marker === 0xda || marker === 0xd9) break // image data starts: no more metadata
      const size = view.getUint16(at + 2)
      if (marker === 0xe1 && ascii(at + 4, 4) === 'Exif') return sub(bytes, at + 10, size - 8)
      at += 2 + size
    }
    return null
  }
  // PNG: chunks after the 8-byte signature; EXIF is the "eXIf" chunk.
  if (bytes.length > 8 && ascii(1, 3) === 'PNG') {
    let at = 8
    while (at + 8 <= bytes.length) {
      const size = view.getUint32(at)
      const type = ascii(at + 4, 4)
      if (type === 'eXIf') return sub(bytes, at + 8, size)
      if (type === 'IEND') break
      at += 12 + size
    }
    return null
  }
  // WebP: RIFF chunks after "RIFF....WEBP"; EXIF is the "EXIF" chunk (sizes little-endian).
  if (bytes.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    let at = 12
    while (at + 8 <= bytes.length) {
      const type = ascii(at, 4)
      const size = view.getUint32(at + 4, true)
      if (type === 'EXIF') {
        // Some writers keep the JPEG-style "Exif\0\0" prefix inside the chunk.
        const start = ascii(at + 8, 4) === 'Exif' ? at + 14 : at + 8
        return sub(bytes, start, size - (start - at - 8))
      }
      at += 8 + size + (size % 2)
    }
  }
  return null
}

function sub(bytes: Uint8Array, start: number, length: number): DataView | null {
  if (start < 0 || length <= 8 || start + length > bytes.length) return null
  return new DataView(bytes.buffer, bytes.byteOffset + start, length)
}

/** The GPS point in a TIFF/EXIF block, or null (no GPS, a (0, 0) "no fix", or a broken block). */
export function gpsFromTiff(tiff: DataView): GpsPoint | null {
  try {
    const order = tiff.getUint16(0)
    if (order !== 0x4949 && order !== 0x4d4d) return null
    const le = order === 0x4949
    const u16 = (at: number) => tiff.getUint16(at, le)
    const u32 = (at: number) => tiff.getUint32(at, le)

    /** Entries of the IFD at [offset]: tag -> offset of its 12-byte entry. */
    const entries = (offset: number) => {
      const out = new Map<number, number>()
      const count = u16(offset)
      for (let i = 0; i < count; i++) out.set(u16(offset + 2 + i * 12), offset + 2 + i * 12)
      return out
    }
    const ifd0 = entries(u32(4))
    const gpsEntry = ifd0.get(GPS_IFD_POINTER)
    if (gpsEntry === undefined) return null
    const gps = entries(u32(gpsEntry + 8))

    const ref = (tag: number) => {
      const e = gps.get(tag)
      return e === undefined ? '' : String.fromCharCode(tiff.getUint8(e + 8))
    }
    /** Three RATIONALs (degrees, minutes, seconds) as decimal degrees. */
    const dms = (tag: number) => {
      const e = gps.get(tag)
      if (e === undefined || u16(e + 2) !== 5 || u32(e + 4) < 3) return null
      const at = u32(e + 8)
      const part = (i: number) => {
        const den = u32(at + i * 8 + 4)
        return den ? u32(at + i * 8) / den : 0
      }
      return part(0) + part(1) / 60 + part(2) / 3600
    }
    let lat = dms(2)
    let lng = dms(4)
    if (lat === null || lng === null) return null
    if (ref(1).toUpperCase() === 'S') lat = -lat
    if (ref(3).toUpperCase() === 'W') lng = -lng
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null
    return { lat, lng }
  } catch {
    return null // a truncated or odd block: treat as no location
  }
}

/** The GPS point a photo file carries, or null. Reads only the first 256 KB (metadata comes first). */
export async function readPhotoGps(file: Blob): Promise<GpsPoint | null> {
  const head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer())
  const tiff = findTiff(head)
  return tiff ? gpsFromTiff(tiff) : null
}
