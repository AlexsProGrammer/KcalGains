import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge(clsx('animate-pulse rounded-md bg-surface-2/80', className))} {...props} />
}
