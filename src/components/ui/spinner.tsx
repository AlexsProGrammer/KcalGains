import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      aria-label="Loading"
      className={twMerge(
        clsx(
          'inline-block animate-spin rounded-full border-current border-r-transparent align-middle text-accent-text',
          sizeMap[size],
          className,
        ),
      )}
    />
  )
}
