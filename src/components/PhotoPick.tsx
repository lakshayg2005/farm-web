import { useEffect, useState } from 'react'
import { readPhotoGps } from '@/api/exifGps'
import { photoLocationHint } from '@/api/media'

/**
 * Says next to a chosen photo whether it carries a camera location. Without one (a screenshot,
 * an edited or a downloaded image) it will be shown as Unverified once uploaded.
 */
export function PhotoLocationNote({ file }: { file: File }) {
  const [hasGps, setHasGps] = useState<boolean>()
  useEffect(() => {
    let live = true
    readPhotoGps(file)
      .then((p) => live && setHasGps(p !== null))
      .catch(() => live && setHasGps(false))
    return () => {
      live = false
    }
  }, [file])
  const hint = photoLocationHint(hasGps)
  if (!hint) return null
  return <span className={`text-xs ${hint.ok ? 'text-primary' : 'text-danger'}`}>{hint.text}</span>
}

/**
 * "Take a photo" (opens the camera on a phone, so the photo carries the camera's location) and
 * "Choose photos" (files, which may have no location and then show as Unverified).
 */
export function PhotoPickButtons({ onFiles, multiple = true }: { onFiles: (files: FileList | null) => void; multiple?: boolean }) {
  const pick = 'inline-block cursor-pointer rounded-lg border border-dashed border-ink-soft px-4 py-2 font-semibold hover:bg-paper'
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <label className={pick}>
        Take a photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
      <label className={pick}>
        {multiple ? 'Choose photos' : 'Choose a photo'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

/** The rule, said once under the photo inputs. */
export const VERIFY_RULE =
  'Photos taken at the farm with the camera’s location on get a Verified badge. Screenshots, downloaded or edited images have no location and show as Unverified.'
