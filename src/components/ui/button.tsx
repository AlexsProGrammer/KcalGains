import type { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const styles = {
  primary: 'bg-accent-fill text-accent-contrast hover:bg-accent-fill-hover shadow-accent-glow',
  secondary: 'bg-surface-2 text-ink-hi hover:bg-surface-3 border border-line',
  ghost: 'text-ink-mid hover:bg-surface-2 hover:text-ink-hi',
  danger: 'bg-danger text-ink-inverse hover:bg-danger/90',
  tonal: 'bg-accent/10 text-accent-text border border-accent/30 hover:bg-accent/15',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof styles
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={twMerge(clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text/70 disabled:pointer-events-none disabled:opacity-50',
        styles[variant],
        {
          sm: 'min-h-[36px] px-3 text-xs',
          md: 'min-h-[44px] px-4 text-sm',
          lg: 'min-h-[48px] px-5 text-base',
          icon: 'h-10 w-10 min-w-[44px] p-0 text-sm',
        }[size],
        className,
      ))}
      {...props}
    />
  )
}
