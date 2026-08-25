import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type SurfaceProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: SurfaceProps) {
  return <div className={twMerge(clsx('rounded-card border border-line bg-surface-1/90 shadow-elevation-2 backdrop-blur-sm', className))} {...props} />
}

type CardHeaderProps = SurfaceProps & {
  icon?: ReactNode
  title: string
  actions?: ReactNode
}

export function CardHeader({ className, icon, title, actions, ...props }: CardHeaderProps) {
  return (
    <div className={twMerge(clsx('flex items-center justify-between gap-3 px-5 pt-5 text-sm font-semibold text-ink-hi', className))} {...props}>
      <div className="flex items-center gap-3">
        {icon ? <span className="text-accent-text [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{icon}</span> : null}
        {title}
      </div>
      {actions ? <div className="flex items-center">{actions}</div> : null}
    </div>
  )
}

export function CardContent({ className, ...props }: SurfaceProps) {
  return <div className={twMerge(clsx('px-5 pb-5 pt-3 text-sm leading-6 text-ink-mid', className))} {...props} />
}
