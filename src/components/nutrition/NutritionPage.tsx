import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarRange, ChartColumn, Dumbbell, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented'
import { db } from '@/db'
import { AutoMealPlanner } from '@/components/planner/AutoMealPlanner'
import { BalancerContainer } from '@/components/balancer/BalancerContainer'
import { FoodManagement } from '@/components/food/FoodManagement'
import { MealMicronutrientSummary } from '@/components/nutrition/MealMicronutrientSummary'
import { MicronutrientRadar } from '@/components/nutrition/MicronutrientRadar'
import { useDynamicTargets } from '@/hooks/useDynamicTargets'
import { useProfile } from '@/hooks/useProfile'
import type { Meal } from '@/types'

const tabs = [
  { value: 'log', label: 'Log' },
  { value: 'micros', label: 'Micros' },
  { value: 'plan', label: 'Plan' },
  { value: 'balance', label: 'Balance' },
  { value: 'library', label: 'Library' },
]

export function NutritionPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'log'
  const today = new Date().toISOString().slice(0, 10)
  const { targets } = useDynamicTargets()
  const { profile } = useProfile()

  const meals = useLiveQuery(() => db.meals.where('date').equals(today).toArray(), [today], []) as Meal[]

  const totals = useMemo(() => meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  ), [meals])

  const activeTab = tabs.some((entry) => entry.value === tab) ? tab : 'log'

  const handleTabChange = (nextValue: string) => {
    setSearchParams({ tab: nextValue }, { replace: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">Nutrition</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink-hi">Daily energy and macro tracking</h2>
        </div>
        <SegmentedControl value={activeTab} onValueChange={handleTabChange} items={tabs} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader icon={<UtensilsCrossed />} title="Calories" />
          <CardContent className="text-2xl font-semibold text-ink-hi num">{totals.calories} <span className="text-sm text-ink-mid">/ {targets.calories}</span></CardContent>
        </Card>
        <Card>
          <CardHeader icon={<ChartColumn />} title="Protein" />
          <CardContent className="text-2xl font-semibold text-ink-hi num">{totals.protein} <span className="text-sm text-ink-mid">g</span></CardContent>
        </Card>
        <Card>
          <CardHeader icon={<CalendarRange />} title="Carbs" />
          <CardContent className="text-2xl font-semibold text-ink-hi num">{totals.carbs} <span className="text-sm text-ink-mid">g</span></CardContent>
        </Card>
        <Card>
          <CardHeader icon={<Dumbbell />} title="Fat" />
          <CardContent className="text-2xl font-semibold text-ink-hi num">{totals.fat} <span className="text-sm text-ink-mid">g</span></CardContent>
        </Card>
      </div>

      {activeTab === 'log' ? (
        <Card>
          <CardHeader icon={<UtensilsCrossed />} title="Today log" />
          <CardContent className="space-y-3">
            {meals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
                No meals logged yet today. Use the Plan or Library tabs to add food.
              </div>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="rounded-xl border border-line bg-surface-0 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium capitalize text-ink-hi">{meal.mealType}</span>
                    <span className="num text-xs text-ink-mid">{meal.totalCalories} kcal</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink-mid">
                    <span>Protein {meal.totalProtein}g</span>
                    <span>Carbs {meal.totalCarbs}g</span>
                    <span>Fat {meal.totalFat}g</span>
                  </div>
                  <MealMicronutrientSummary meal={meal} profile={profile} compact />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'micros' ? <MicronutrientRadar meals={meals} /> : null}
      {activeTab === 'plan' ? <AutoMealPlanner /> : null}
      {activeTab === 'balance' ? <BalancerContainer /> : null}
      {activeTab === 'library' ? <FoodManagement /> : null}
    </div>
  )
}
