import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useNutritionTrend } from '@/hooks/useNutritionTrend'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function MacroTrendChart() {
  const { trend } = useNutritionTrend(30)

  if (trend.length === 0) {
    return (
      <Card>
        <CardHeader title="Macro trend (30 days)" />
        <CardContent>
          <div className="py-16 text-center text-sm text-slate-500">Log some meals to see your nutrition trends.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Macro trend (30 days)" />
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
                <Line type="monotone" dataKey="caloriesConsumed" stroke="#f59e0b" strokeWidth={2} name="Calories" dot={false} />
                <Line type="monotone" dataKey="targetCalories" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" name="Target kcal" dot={false} />
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
                <Bar dataKey="proteinConsumed" stackId="a" fill="#06b6d4" name="Protein (g)" />
                <Bar dataKey="carbsConsumed" stackId="a" fill="#ec4899" name="Carbs (g)" />
                <Bar dataKey="fatConsumed" stackId="a" fill="#f97316" name="Fat (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
