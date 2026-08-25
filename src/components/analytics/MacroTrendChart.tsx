import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useT } from '@/i18n'
import { useNutritionTrend } from '@/hooks/useNutritionTrend'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type MacroTrendChartProps = {
  days?: number | 'all'
}

export function MacroTrendChart({ days = 30 }: MacroTrendChartProps) {
  const { t } = useT()
  const effectiveDays = days === 'all' ? 365 : days
  const { trend } = useNutritionTrend(effectiveDays)
  const title = days === 'all' ? t.progress.macroTrendAll : t.progress.macroTrend.replace('{days}', String(days))

  if (trend.length === 0) {
    return (
      <Card>
        <CardHeader title={title} />
        <CardContent>
          <div className="py-16 text-center text-sm text-slate-500">{t.progress.macroEmpty}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <div className="space-y-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
                <Line type="monotone" dataKey="caloriesConsumed" stroke="#f59e0b" strokeWidth={2} name={t.progress.calories} dot={false} />
                <Line type="monotone" dataKey="targetCalories" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" name={t.progress.targetKcal} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
                <Bar dataKey="proteinConsumed" stackId="a" fill="#06b6d4" name={t.progress.proteinGrams} />
                <Bar dataKey="carbsConsumed" stackId="a" fill="#ec4899" name={t.progress.carbsGrams} />
                <Bar dataKey="fatConsumed" stackId="a" fill="#f97316" name={t.progress.fatGrams} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
