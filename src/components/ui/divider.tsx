import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={twMerge(clsx('border-0 border-t border-line', className))} {...props} />
}
