import { useState, type FormEvent } from 'react'
import { searchPlaces, type GeoResult } from '@/api/geocode'

/** A small "find my area" box: type a village, town or address and pick a result. */
export function PlaceSearch({
  onPick,
  placeholder = 'Search your village, town or address…',
}: {
  onPick: (place: GeoResult) => void
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    event.stopPropagation()
    setNote('')
    setBusy(true)
    try {
      const found = await searchPlaces(text)
      setResults(found)
      if (found.length === 0) setNote('No place found. Try a nearby town or add the district.')
    } catch {
      setNote('Place search is unavailable right now. Check your internet connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <div role="search" className="flex gap-2">
        <input
          type="search"
          aria-label="Search a place"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit(e)
          }}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4"
        />
        <button type="button" onClick={(e) => void submit(e)} disabled={busy || text.trim().length < 3} className="btn-ghost h-11 !px-5 !py-0">
          {busy ? 'Searching…' : 'Search'}
        </button>
      </div>
      {note && <p role="status" className="mt-2 text-sm text-ink-soft">{note}</p>}
      {results.length > 0 && (
        <ul className="absolute z-[1000] mt-2 max-h-64 w-full overflow-auto rounded-xl border border-line bg-paper shadow-lg">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng},${r.name}`}>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm hover:bg-paper-deep"
                onClick={() => {
                  setResults([])
                  setText(r.name.split(',').slice(0, 2).join(','))
                  onPick(r)
                }}
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
