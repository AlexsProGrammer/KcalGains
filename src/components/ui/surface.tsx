import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx('rounded-card border border-line bg-surface-1/90 shadow-elevation-1 backdrop-blur-sm', className),
      )}
      {...props}
    />
  )
}
