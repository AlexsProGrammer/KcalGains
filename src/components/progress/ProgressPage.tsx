import { useMemo, useState } from 'react'
import { Activity, BarChart3, Scale, TrendingUp } from 'lucide-react'
import { BmiCard } from '@/components/analytics/BmiCard'
import { MacroTrendChart } from '@/components/analytics/MacroTrendChart'
import { MealBreakdownChart } from '@/components/analytics/MealBreakdownChart'
import { TdeeStatsCard } from '@/components/analytics/TdeeStatsCard'
import { WeightTrendChart } from '@/components/analytics/WeightTrendChart'
import { FoodHistoryList } from '@/components/history/FoodHistoryList'
import { MealHistoryList } from '@/components/history/MealHistoryList'
import { ViewModeToggle } from '@/components/history/ViewModeToggle'
import { WeightHistoryList } from '@/components/history/WeightHistoryList'
import { WorkoutHistoryList } from '@/components/history/WorkoutHistoryList'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented'
import type { ViewMode } from '@/types'

const ranges = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: 'all', label: 'All' },
] as const

export function ProgressPage() {
  const [range, setRange] = useState<'7' | '30' | '90' | 'all'>('30')
  const [viewMode, setViewMode] = useState<ViewMode>('graph')

  const chartDays = useMemo(() => {
    if (range === 'all') return 'all'
    return Number(range)
  }, [range])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">Progress</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink-hi">Performance trends and history</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl value={range} onValueChange={(next) => setRange(next as '7' | '30' | '90' | 'all')} items={ranges.map((item) => ({ value: item.value, label: item.label }))} />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WeightTrendChart days={chartDays} />
        <BmiCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MacroTrendChart days={chartDays} />
        <MealBreakdownChart />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<BarChart3 />} title="Volume trend" />
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line bg-surface-0 text-sm text-ink-mid">
              Volume chart ready for the next analytics pass.
            </div>
          </CardContent>
        </Card>
        <TdeeStatsCard />
      </div>

      <div className="space-y-4">
        {viewMode === 'graph' ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <MealHistoryList viewMode={viewMode} />
            <WorkoutHistoryList viewMode={viewMode} />
          </div>
        ) : (
          <div className="grid gap-4">
            <MealHistoryList viewMode={viewMode} />
            <WorkoutHistoryList viewMode={viewMode} />
            <FoodHistoryList viewMode={viewMode} />
            <WeightHistoryList viewMode={viewMode} />
          </div>
        )}
      </div>
    </div>
  )
}
