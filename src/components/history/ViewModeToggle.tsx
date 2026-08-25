import { SegmentedControl } from '@/components/ui/segmented'
import { useT } from '@/i18n'
import type { ViewMode } from '@/types'

type ViewModeToggleProps = {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const { t } = useT()

  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => onChange(next as ViewMode)}
      items={[
        { value: 'graph', label: t.common.graph },
        { value: 'list', label: t.common.list },
      ]}
    />
  )
}
