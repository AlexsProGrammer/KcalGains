import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import type { Meal } from '@/types'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

function formatDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getRangeDates(days: number | 'all', meals: Meal[]) {
  const uniqueDates = [...new Set(meals.map((meal) => meal.date).filter(Boolean))].sort()
  if (uniqueDates.length === 0) return []

  if (days === 'all') return uniqueDates

  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - Math.max(1, days) + 1)
  const startKey = formatDateKey(startDate)
  const endKey = formatDateKey(endDate)

  return uniqueDates.filter((date) => date >= startKey && date <= endKey)
}

export function MealBreakdownChart({ days = 30 }: { days?: number | 'all' }) {
  const meals = useLiveQuery(() => db.meals.toArray(), [], []) as Meal[]

  const periodDates = useMemo(() => getRangeDates(days, meals), [days, meals])

  const macroAverage = useMemo(() => {
    if (periodDates.length === 0) {
      return {
        protein: 0,
        carbs: 0,
        fat: 0,
        calories: 0,
        totalDays: 0,
      }
    }

    const totals = meals
      .filter((meal) => periodDates.includes(meal.date))
      .reduce(
        (acc, meal) => ({
          protein: acc.protein + meal.totalProtein,
          carbs: acc.carbs + meal.totalCarbs,
          fat: acc.fat + meal.totalFat,
          calories: acc.calories + meal.totalCalories,
        }),
        { protein: 0, carbs: 0, fat: 0, calories: 0 },
      )

    const totalDays = new Set(periodDates).size || 1

    return {
      protein: totals.protein / totalDays,
      carbs: totals.carbs / totalDays,
      fat: totals.fat / totalDays,
      calories: totals.calories / totalDays,
      totalDays,
    }
  }, [meals, periodDates])

  const breakdownData = [
    { name: 'Protein', value: Math.round((macroAverage.protein || 0) * 4) },
    { name: 'Carbs', value: Math.round((macroAverage.carbs || 0) * 4) },
    { name: 'Fat', value: Math.round((macroAverage.fat || 0) * 9) },
  ].filter((item) => item.value > 0)

  const COLORS = ['#06b6d4', '#ec4899', '#f97316']
  const label = days === 'all' ? 'All time' : `${days}d`

  return (
    <Card>
      <CardHeader title={`Average macro breakdown (${label})`} />
      <CardContent>
        {breakdownData.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">Log meals to see the average macro breakdown for this period.</div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdownData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {breakdownData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} kcal/day`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Protein</p>
                <p className="text-lg font-semibold text-cyan-400">{macroAverage.protein.toFixed(1)}g</p>
              </div>
              <div className="rounded-md bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Carbs</p>
                <p className="text-lg font-semibold text-pink-400">{macroAverage.carbs.toFixed(1)}g</p>
              </div>
              <div className="rounded-md bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Fat</p>
                <p className="text-lg font-semibold text-orange-400">{macroAverage.fat.toFixed(1)}g</p>
              </div>
            </div>

            <div className="w-full text-center">
              <p className="text-sm font-semibold text-slate-100">Avg total: {macroAverage.calories.toFixed(0)} kcal/day</p>
              <p className="text-xs text-slate-400">Across {macroAverage.totalDays} days</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
