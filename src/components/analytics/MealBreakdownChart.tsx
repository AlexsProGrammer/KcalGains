import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { aggregateMealsForDate } from '@/services/nutritionAggregationService'
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export function MealBreakdownChart() {
  const meals = useLiveQuery(() => db.meals.toArray(), [], [])
  const today = new Date().toISOString().slice(0, 10)

  const todayMeals = meals ? meals.filter((m) => m.date === today) : []
  const nutrition = aggregateMealsForDate(todayMeals, today)

  const breakdownData = [
    { name: 'Protein', value: Math.round(nutrition.proteinConsumed * 4) },
    { name: 'Carbs', value: Math.round(nutrition.carbsConsumed * 4) },
    { name: 'Fat', value: Math.round(nutrition.fatConsumed * 9) },
  ].filter((item) => item.value > 0)

  const COLORS = ['#06b6d4', '#ec4899', '#f97316']

  return (
    <Card>
      <CardHeader title="Today's macro breakdown" />
      <CardContent>
        {breakdownData.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">Log a meal to see your macro breakdown.</div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdownData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {breakdownData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} kcal`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Protein</p>
                <p className="text-lg font-semibold text-cyan-400">{nutrition.proteinConsumed.toFixed(1)}g</p>
              </div>
              <div className="rounded-md bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Carbs</p>
                <p className="text-lg font-semibold text-pink-400">{nutrition.carbsConsumed.toFixed(1)}g</p>
              </div>
              <div className="rounded-md bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Fat</p>
                <p className="text-lg font-semibold text-orange-400">{nutrition.fatConsumed.toFixed(1)}g</p>
              </div>
            </div>

            <div className="w-full text-center">
              <p className="text-sm font-semibold text-slate-100">Total: {nutrition.caloriesConsumed.toFixed(0)} kcal</p>
              <p className="text-xs text-slate-400">Target: {nutrition.targetCalories.toFixed(0)} kcal</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
