import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { WeightQuickAddModal } from '@/components/analytics/WeightQuickAddModal'
import { useWeightTrends } from '@/hooks/useWeightTrends'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type WeightTrendChartProps = {
  days?: number | 'all'
}

export function WeightTrendChart({ days = 30 }: WeightTrendChartProps) {
  const { t } = useT()
  const { trend } = useWeightTrends()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const visibleData = days === 'all' ? trend : trend.slice(-days)
  const title = days === 'all' ? t.progress.weightTrendAll : t.progress.weightTrend.replace('{days}', String(days))

  return (
    <>
      <Card>
        <CardHeader
          title={title}
          actions={
            <Button type="button" size="icon" variant="secondary" aria-label={t.progress.addWeight} onClick={() => setQuickAddOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
        <CardContent>
          <div className="h-56">{visibleData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={visibleData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="weightKg" stroke="#94a3b8" strokeWidth={1} dot={{ r: 2, fill: '#94a3b8' }} name={t.progress.rawWeight} /><Line type="monotone" dataKey="smoothedWeightKg" stroke="rgb(var(--accent-400))" strokeWidth={3} dot={false} name={t.progress.emaTrend} /></LineChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-slate-600">{t.progress.addWeightEmpty}</p>}</div>
        </CardContent>
      </Card>
      <WeightQuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  )
}
