import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type StatTileProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  value: ReactNode
  hint?: ReactNode
}

export function StatTile({ className, label, value, hint, ...props }: StatTileProps) {
  return (
    <div className={twMerge(clsx('rounded-card border border-line bg-surface-1 p-3', className))} {...props}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-low">{label}</p>
      <div className="mt-2 num text-lg font-semibold text-ink-hi">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-mid">{hint}</div> : null}
    </div>
  )
}
