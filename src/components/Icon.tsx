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
  back: 'M15 5l-7 7 7 7',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  truck: 'M3 6.5h11v9.5H3V6.5Z M14 10h4l3 3v3h-7v-6Z M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  leaf: 'M5 19c0-8 5-13.5 15-14-.5 10-6 15-14 15 M5 19l7-7',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8L12 3.5Z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12 M18 6 6 18',
  sliders: 'M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4',
  sparkle: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6',
  basket: 'M3.5 9.5h17l-1.8 9.5H5.3L3.5 9.5Z M8 9.5l3-5.5 M16 9.5l-3-5.5 M9 13v3 M15 13v3 M12 13v3',
  thermometer: 'M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z M12 9v7',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14.3c2.1.7 3.5 2.8 3.5 5.7',
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
