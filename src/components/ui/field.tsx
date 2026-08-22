import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const controlStyles = 'min-h-[44px] w-full rounded-md border border-line bg-surface-0 px-3 text-sm text-ink-hi placeholder:text-ink-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text/70'

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={twMerge(clsx('block', className))}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-[0.08em] text-ink-low">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-low">{hint}</span> : null}
    </label>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={twMerge(clsx(controlStyles, className))} {...props} />
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={twMerge(clsx(controlStyles, className))} {...props} />
}
