export const ACCENT_OPTIONS = [
  { value: 'emerald', label: 'Emerald', swatch: '#34d399' },
  { value: 'lime', label: 'Lime', swatch: '#a3e635' },
  { value: 'teal', label: 'Teal', swatch: '#2dd4bf' },
  { value: 'cyan', label: 'Cyan', swatch: '#22d3ee' },
  { value: 'violet', label: 'Violet', swatch: '#a78bfa' },
  { value: 'amber', label: 'Amber', swatch: '#fbbf24' },
  { value: 'rose', label: 'Rose', swatch: '#fb7185' },
  { value: 'blue', label: 'Blue', swatch: '#60a5fa' },
] as const

export type AccentName = (typeof ACCENT_OPTIONS)[number]['value']

export const DEFAULT_ACCENT: AccentName = 'emerald'
