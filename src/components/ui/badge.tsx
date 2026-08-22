import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variants = {
  default: 'border border-line bg-surface-2 text-ink-mid',
  success: 'border border-success/40 bg-success/10 text-success',
  warning: 'border border-warning/40 bg-warning/10 text-warning',
  danger: 'border border-danger/40 bg-danger/10 text-danger',
  info: 'border border-info/40 bg-info/10 text-info',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span className={twMerge(clsx('inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]', variants[variant], className))} {...props} />
}
