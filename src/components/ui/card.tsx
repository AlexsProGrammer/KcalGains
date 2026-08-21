import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type SurfaceProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: SurfaceProps) {
  return <div className={twMerge(clsx('rounded-lg border border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20', className))} {...props} />
}

type CardHeaderProps = SurfaceProps & {
  icon?: ReactNode
  title: string
}

export function CardHeader({ className, icon, title, ...props }: CardHeaderProps) {
  return (
    <div className={twMerge(clsx('flex items-center gap-3 px-5 pt-5 text-sm font-semibold text-slate-100', className))} {...props}>
      {icon ? <span className="text-emerald-400 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{icon}</span> : null}
      {title}
    </div>
  )
}

export function CardContent({ className, ...props }: SurfaceProps) {
  return <div className={twMerge(clsx('px-5 pb-5 pt-3 text-sm leading-6 text-slate-400', className))} {...props} />
}
