import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type SectionProps = HTMLAttributes<HTMLElement> & {
  title: string
  action?: ReactNode
  description?: ReactNode
}

export function Section({ className, title, action, description, children, ...props }: SectionProps) {
  return (
    <section className={twMerge(clsx('space-y-4', className))} {...props}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-hi">{title}</h2>
          {description ? <div className="mt-1 text-sm text-ink-mid">{description}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
