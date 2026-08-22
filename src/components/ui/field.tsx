import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const controlStyles = 'min-h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400'

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={twMerge(clsx('block', className))}>
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={twMerge(clsx(controlStyles, className))} {...props} />
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={twMerge(clsx(controlStyles, className))} {...props} />
}
