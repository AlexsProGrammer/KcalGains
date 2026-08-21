import type { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const styles = {
  primary: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof styles
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={twMerge(clsx(
        'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:pointer-events-none disabled:opacity-50',
        styles[variant],
        { sm: 'min-h-8 px-3 text-xs', md: 'min-h-10 px-4 text-sm', lg: 'min-h-12 px-5 text-base' }[size],
        className,
      ))}
      {...props}
    />
  )
}
