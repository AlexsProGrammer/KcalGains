import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Button } from './button'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={twMerge(clsx('flex min-h-[220px] flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface-1/60 p-6 text-center', className))}>
      {icon ? <div className="mb-4 text-accent-text">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-ink-hi">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-ink-mid">{description}</p> : null}
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}
