import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  return (
    <label className={twMerge(clsx('flex cursor-pointer items-start justify-between gap-4 rounded-md border border-line bg-surface-0 p-3', disabled && 'cursor-not-allowed opacity-60', className))}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-hi">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-5 text-ink-mid">{description}</span> : null}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="block h-6 w-11 rounded-full bg-surface-2 transition-colors peer-checked:bg-accent-fill peer-focus-visible:ring-2 peer-focus-visible:ring-accent-text/70" aria-hidden="true" />
        <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-ink-inverse transition-transform peer-checked:translate-x-5" aria-hidden="true" />
      </span>
    </label>
  )
}
