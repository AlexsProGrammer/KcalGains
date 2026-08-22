import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  value: number
  max?: number
  color?: 'accent' | 'success' | 'warning' | 'danger'
}

const colorMap = {
  accent: 'bg-accent-fill',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function ProgressBar({ className, value, max = 100, color = 'accent', ...props }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percentage = max === 0 ? 0 : (clamped / max) * 100

  return (
    <div className={twMerge(clsx('h-2 w-full overflow-hidden rounded-full bg-surface-2', className))} {...props}>
      <div className={twMerge(clsx('h-full rounded-full transition-all duration-300', colorMap[color]))} style={{ width: `${percentage}%` }} />
    </div>
  )
}

type ProgressRingProps = {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: 'accent' | 'success' | 'warning' | 'danger'
  label?: string
}

const ringColorMap = {
  accent: 'var(--accent-fill)',
  success: 'rgb(var(--success))',
  warning: 'rgb(var(--warning))',
  danger: 'rgb(var(--danger))',
}

export function ProgressRing({ value, max = 100, size = 120, strokeWidth = 10, color = 'accent', label }: ProgressRingProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percentage = max === 0 ? 0 : (clamped / max) * 100
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center num" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible" aria-label={label ?? 'Progress'}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgb(var(--line))" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColorMap[color]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-semibold text-ink-hi">{Math.round(percentage)}%</span>
        {label ? <span className="text-[10px] uppercase tracking-[0.12em] text-ink-low">{label}</span> : null}
      </div>
    </div>
  )
}
