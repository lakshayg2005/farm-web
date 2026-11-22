const paths = {
  tag: 'M3 12.5V4h8.5l9.5 9.5-8.5 8.5L3 12.5Z M7.5 8.5h.01',
  box: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z M3 7.5l9 4.5 9-4.5 M12 12v9',
  plot: 'M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20V6.5Z M9 4v13.5 M15 6.5V20',
  calendar: 'M4 6.5h16V20H4V6.5Z M8 3.5v5 M16 3.5v5 M4 11h16 M9 15.5l2 2 4-4',
  sprout: 'M12 21v-8 M12 13c0-4.5-3-7-7.5-7 0 4.5 3 7 7.5 7Z M12 10.5c0-4 2.7-6.5 7.5-6.5 0 4-2.7 6.5-7.5 6.5Z',
  search: 'M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20.5 20.5l-5-5',
  clipboard: 'M6 4.5h12V21H6V4.5Z M9.5 3h5v3h-5V3Z M9 13l2 2 4-4',
  grid: 'M4 4h7v7H4V4Z M13 4h7v4h-7V4Z M13 10h7v10h-7V10Z M4 13h7v7H4v-7Z',
  shield: 'M12 3l8 3v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6l8-3Z M8.5 12l2.5 2.5 4.5-4.5',
  route: 'M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16',
  bell: 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15L6 16.5Z M10 21h4',
  rupee: 'M7 4.5h10 M7 9h10 M7 4.5h3.5a4 4 0 0 1 0 8H7l8 7.5',
  back: 'M15 5l-7 7 7 7',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, className = 'size-6' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  )
}
