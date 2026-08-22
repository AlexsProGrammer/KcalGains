import type { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

export function Chip({ className, active = false, ...props }: ChipProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={twMerge(
        clsx(
          'inline-flex min-h-[36px] items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors',
          active ? 'border-accent/40 bg-accent/12 text-accent-text' : 'border-line bg-surface-2 text-ink-mid hover:bg-surface-3',
          className,
        ),
      )}
      {...props}
    />
  )
}
