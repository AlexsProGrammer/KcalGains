import { SegmentedControl } from '@/components/ui/segmented'
import type { ViewMode } from '@/types'

type ViewModeToggleProps = {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => onChange(next as ViewMode)}
      items={[
        { value: 'graph', label: 'Graph' },
        { value: 'list', label: 'List' },
      ]}
    />
  )
}
