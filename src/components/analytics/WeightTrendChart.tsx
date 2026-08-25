import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WeightQuickAddModal } from '@/components/analytics/WeightQuickAddModal'
import { useWeightTrends } from '@/hooks/useWeightTrends'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type WeightTrendChartProps = {
  days?: number | 'all'
}

export function WeightTrendChart({ days = 30 }: WeightTrendChartProps) {
  const { trend } = useWeightTrends()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const visibleData = days === 'all' ? trend : trend.slice(-days)

  return (
    <>
      <Card>
        <CardHeader
          title={days === 'all' ? 'Weight trend (all time)' : `Weight trend (${days}d)`}
          actions={
            <Button type="button" size="icon" variant="secondary" aria-label="Add weight" onClick={() => setQuickAddOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
        <CardContent>
          <div className="h-56">{visibleData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={visibleData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="weightKg" stroke="#94a3b8" strokeWidth={1} dot={{ r: 2, fill: '#94a3b8' }} name="Raw weight" /><Line type="monotone" dataKey="smoothedWeightKg" stroke="rgb(var(--accent-400))" strokeWidth={3} dot={false} name="EMA trend" /></LineChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-slate-600">Add weight entries to see the EMA trend.</p>}</div>
        </CardContent>
      </Card>
      <WeightQuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  )
}
