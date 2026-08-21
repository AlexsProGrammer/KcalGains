import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

const variants = {
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-50',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-50',
  error: 'border-rose-400/30 bg-rose-400/10 text-rose-50',
}

export function Alert({ className, title, variant = 'info', children, ...props }: AlertProps) {
  return (
    <div role="status" className={twMerge(clsx('rounded-lg border px-4 py-3 text-sm', variants[variant], className))} {...props}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1 opacity-80' : undefined}>{children}</div>
    </div>
  )
}
