import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarRange, ChartColumn, Dumbbell, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { BarcodeNutritionTab } from '@/components/nutrition/BarcodeNutritionTab'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented'
import { db } from '@/db'
import { AutoMealPlanner } from '@/components/planner/AutoMealPlanner'
import { BalancerContainer } from '@/components/balancer/BalancerContainer'
import { FoodManagement } from '@/components/food/FoodManagement'
import { MealLogCard } from '@/components/nutrition/MealLogCard'
import { MealQuickEditorModal } from '@/components/nutrition/MealQuickEditorModal'
import { MicronutrientRadar } from '@/components/nutrition/MicronutrientRadar'
import { useDynamicTargets } from '@/hooks/useDynamicTargets'
import { useProfile } from '@/hooks/useProfile'
import type { Meal } from '@/types'

const tabs = [
  { value: 'log', label: 'Log' },
  { value: 'barcode', label: 'Barcode' },
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mealEditorOpen, setMealEditorOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)

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

  async function updateMeal(meal: Meal, patch: Partial<Meal>) {
    await db.meals.put({ ...meal, ...patch })
    setSuccessMessage('Meal updated.')
  }

  function openAddMeal() {
    setSelectedMeal(null)
    setMealEditorOpen(true)
  }

  function openEditMeal(meal: Meal) {
    setSelectedMeal(meal)
    setMealEditorOpen(true)
  }

  async function handleDeleteMeal(mealId: string) {
    await db.meals.delete(mealId)
    setSuccessMessage('Meal removed from today\'s log.')
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

      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <Card className="min-w-0">
          <CardHeader icon={<UtensilsCrossed className="h-3.5 w-3.5" />} title="Calories" className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {totals.calories}
            <span className="ml-1 text-[11px] text-ink-mid">/ {targets.calories}</span>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<ChartColumn className="h-3.5 w-3.5" />} title="Protein" className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {totals.protein}
            <span className="ml-1 text-[11px] text-ink-mid">g</span>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<CalendarRange className="h-3.5 w-3.5" />} title="Carbs" className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {totals.carbs}
            <span className="ml-1 text-[11px] text-ink-mid">g</span>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<Dumbbell className="h-3.5 w-3.5" />} title="Fat" className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {totals.fat}
            <span className="ml-1 text-[11px] text-ink-mid">g</span>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'log' ? (
        <Card>
          <CardHeader
            icon={<UtensilsCrossed />}
            title="Today log"
            actions={
              <Button type="button" size="sm" variant="secondary" onClick={openAddMeal}>
                <Plus className="h-4 w-4" />
                Add meal
              </Button>
            }
          />
          <CardContent className="space-y-3">
            {meals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
                No meals logged yet today. Use the Plan or Library tabs to add food.
              </div>
            ) : (
              meals.map((meal) => (
                <MealLogCard
                  key={meal.id}
                  meal={meal}
                  profile={profile}
                  onEdit={openEditMeal}
                  onDelete={handleDeleteMeal}
                />
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'barcode' ? <BarcodeNutritionTab /> : null}
      {activeTab === 'micros' ? <MicronutrientRadar meals={meals} /> : null}
      {activeTab === 'plan' ? <AutoMealPlanner /> : null}
      {activeTab === 'balance' ? <BalancerContainer /> : null}
      {activeTab === 'library' ? <FoodManagement /> : null}

      <MealQuickEditorModal
        open={mealEditorOpen}
        meal={selectedMeal}
        date={today}
        onClose={() => {
          setMealEditorOpen(false)
          setSelectedMeal(null)
        }}
        onSaved={(message) => {
          setSuccessMessage(message)
          setMealEditorOpen(false)
          setSelectedMeal(null)
        }}
      />
    </div>
  )
}
