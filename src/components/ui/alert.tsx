import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

const variants = {
  info: 'border-info/40 bg-info/10 text-ink-hi',
  success: 'border-success/50 bg-success/10 text-ink-hi',
  warning: 'border-warning/50 bg-warning/10 text-ink-hi',
  error: 'border-danger/50 bg-danger/10 text-ink-hi',
}

export function Alert({ className, title, variant = 'info', children, ...props }: AlertProps) {
  return (
    <div role="status" className={twMerge(clsx('rounded-card border px-4 py-3 text-sm shadow-elevation-1', variants[variant], className))} {...props}>
      {title ? <p className="font-semibold text-ink-hi">{title}</p> : null}
      <div className={title ? 'mt-1 text-ink-mid' : 'text-ink-mid'}>{children}</div>
    </div>
  )
}
