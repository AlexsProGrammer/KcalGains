import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarRange, ChefHat, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { db } from '@/db'
import { commitBalancedMealToLog } from '@/hooks/useMealLogger'
import { useDynamicTargets } from '@/hooks/useDynamicTargets'
import { planDay, suggestMeal, type MealType, type PlannedMeal } from '@/services/mealPlannerService'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const PANTRY_FILTERS = [
  { value: 'all', label: 'Whole library' },
  { value: 'custom', label: 'My pantry (custom foods)' },
] as const

type PantryFilter = (typeof PANTRY_FILTERS)[number]['value']

export function AutoMealPlanner() {
  const allFoods = useLiveQuery(() => db.foods.toArray(), [], [])
  const targets = useDynamicTargets()
  const [pantryFilter, setPantryFilter] = useState<PantryFilter>('all')
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [plan, setPlan] = useState<PlannedMeal[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const foods = useMemo(
    () => (pantryFilter === 'custom' ? allFoods.filter((food) => food.isCustom) : allFoods),
    [allFoods, pantryFilter],
  )

  const foodNames = useMemo(() => new Map(allFoods.map((food) => [food.id, food.name])), [allFoods])

  const dailyTargets = {
    calories: targets.calories,
    protein: targets.protein,
    carbs: targets.carbs,
    fat: targets.fat,
  }

  function reset(next: PlannedMeal[], emptyMessage: string) {
    setMessage(null)
    if (next.length === 0) {
      setError(emptyMessage)
      setPlan([])
      return
    }
    setError(null)
    setPlan(next)
  }

  function handleSuggest() {
    const suggestion = suggestMeal(foods, dailyTargets, mealType)
    reset(suggestion ? [suggestion] : [], 'Not enough foods to build a meal. Add more to your library.')
  }

  function handlePlanDay() {
    const result = planDay(foods, dailyTargets)
    reset(result.meals, 'Not enough foods to plan a day. Add more to your library.')
  }

  async function logPlannedMeal(planned: PlannedMeal) {
    try {
      await commitBalancedMealToLog(planned.result, planned.mealType, new Date().toISOString().slice(0, 10))
      setMessage(`Logged ${planned.mealType}.`)
    } catch {
      setError('Could not log this meal.')
    }
  }

  async function logAll() {
    for (const planned of plan) {
      await commitBalancedMealToLog(planned.result, planned.mealType, new Date().toISOString().slice(0, 10))
    }
    setMessage(`Logged ${plan.length} meal${plan.length === 1 ? '' : 's'}.`)
  }

  return (
    <Card>
      <CardHeader icon={<ChefHat />} title="Auto meal planner" />
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          Builds meals from your food library scored against {Math.round(dailyTargets.calories)} kcal / {Math.round(dailyTargets.protein)} g protein
          {targets.source === 'goal' ? ' (from goal)' : ' (manual)'}.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Food pool">
            <SelectInput value={pantryFilter} onChange={(event) => setPantryFilter(event.target.value as PantryFilter)}>
              {PANTRY_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Meal to suggest">
            <SelectInput value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}>
              {MEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={handleSuggest} disabled={foods.length < 2}>
            <ChefHat className="mr-2 h-4 w-4" />
            Suggest meal
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={handlePlanDay} disabled={foods.length < 2}>
            <CalendarRange className="mr-2 h-4 w-4" />
            Plan my day
          </Button>
          {plan.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => (plan.length > 1 ? handlePlanDay() : handleSuggest())}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          ) : null}
        </div>

        {error ? <Alert variant="warning">{error}</Alert> : null}
        {message ? <Alert variant="success">{message}</Alert> : null}

        {plan.map((planned) => (
          <div key={planned.mealType} className="rounded-md border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold capitalize text-slate-100">{planned.mealType}</h3>
              <span className="text-xs text-slate-500">
                {Math.round(planned.result.totalMacros.calories)} / {planned.targets.calories} kcal
              </span>
            </div>

            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {planned.result.solution
                .filter((item) => item.grams > 0)
                .map((item) => (
                  <li key={item.foodId} className="flex justify-between gap-3">
                    <span>{foodNames.get(item.foodId) ?? item.foodId}</span>
                    <span className="text-slate-500">{Math.round(item.grams)} g</span>
                  </li>
                ))}
            </ul>

            <p className="mt-2 text-xs text-slate-500">
              P {Math.round(planned.result.totalMacros.protein)} g · C {Math.round(planned.result.totalMacros.carbs)} g · F{' '}
              {Math.round(planned.result.totalMacros.fat)} g
            </p>

            <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => void logPlannedMeal(planned)}>
              <Plus className="mr-2 h-4 w-4" />
              Log this meal
            </Button>
          </div>
        ))}

        {plan.length > 1 ? (
          <Button type="button" size="sm" onClick={() => void logAll()}>
            <Plus className="mr-2 h-4 w-4" />
            Log all {plan.length} meals
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
