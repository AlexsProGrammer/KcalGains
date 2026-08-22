import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/types'

type ViewModeToggleProps = {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 p-1">
      <Button
        type="button"
        variant={value === 'graph' ? 'primary' : 'ghost'}
        size="sm"
        className="min-w-24"
        onClick={() => onChange('graph')}
      >
        Graph
      </Button>
      <Button
        type="button"
        variant={value === 'list' ? 'primary' : 'ghost'}
        size="sm"
        className="min-w-24"
        onClick={() => onChange('list')}
      >
        List
      </Button>
    </div>
  )
}
