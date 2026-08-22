import * as Tabs from '@radix-ui/react-tabs'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type SegmentedProps = {
  value: string
  onValueChange: (value: string) => void
  items: Array<{ value: string; label: string }>
  className?: string
}

export function SegmentedControl({ value, onValueChange, items, className }: SegmentedProps) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} className={twMerge(clsx('inline-flex rounded-full border border-line bg-surface-1 p-1', className))}>
      <Tabs.List className="flex items-center gap-1">
        {items.map((item) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            className={twMerge(
              clsx(
                'min-h-[36px] rounded-full px-3 text-sm font-medium text-ink-mid transition-colors data-[state=active]:bg-accent-fill data-[state=active]:text-accent-contrast',
              ),
            )}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}
