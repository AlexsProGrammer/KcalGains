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
import { useProfile } from '@/hooks/useProfile'
import { filterFoodsByProfile } from '@/services/foodFilterService'
import { calculateMealMicrosFromItems, createEmptyMicronutrientTotals, getMicronutrientProgress, MICRONUTRIENT_KEYS, resolveMicronutrientTargets } from '@/services/micronutrientTargetService'
import { planDay, suggestMeal, type MealType, type PlannedMeal } from '@/services/mealPlannerService'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const PANTRY_FILTERS = [
  { value: 'all', label: 'Whole library' },
  { value: 'custom', label: 'My pantry (custom foods)' },
] as const

type PantryFilter = (typeof PANTRY_FILTERS)[number]['value']

export function AutoMealPlanner() {
  const { profile } = useProfile()
  const allFoods = useLiveQuery(() => db.foods.toArray(), [], [])
  const targets = useDynamicTargets()
  const [pantryFilter, setPantryFilter] = useState<PantryFilter>('all')
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [plan, setPlan] = useState<PlannedMeal[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({})
  const [budgetEnabled, setBudgetEnabled] = useState(true)

  const foods = useMemo(() => {
    const pool = (pantryFilter === 'custom' ? allFoods.filter((food) => food.isCustom) : allFoods)
    const filtered = filterFoodsByProfile(pool, profile)
    return filtered.filtered
  }, [allFoods, pantryFilter, profile])

  const foodNames = useMemo(() => new Map(allFoods.map((food) => [food.id, food.name])), [allFoods])
  const hiddenFoodsCount = useMemo(() => {
    const pool = pantryFilter === 'custom' ? allFoods.filter((food) => food.isCustom) : allFoods
    return filterFoodsByProfile(pool, profile).hiddenCount
  }, [allFoods, pantryFilter, profile])

  const dailyTargets = {
    calories: targets.calories,
    protein: targets.protein,
    carbs: targets.carbs,
    fat: targets.fat,
  }
  const budgetCap = profile?.budgetPerDay ?? 15
  const effectiveBudget = budgetEnabled ? budgetCap : undefined

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
    const suggestion = suggestMeal(foods, dailyTargets, mealType, Math.random, effectiveBudget)
    reset(suggestion ? [suggestion] : [], 'Not enough foods to build a meal. Add more to your library.')
  }

  function handlePlanDay() {
    const result = planDay(foods, dailyTargets, ['breakfast', 'lunch', 'dinner', 'snack'], Math.random, effectiveBudget)
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

        <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Budget cap</div>
            <div className="mt-1 text-slate-200">€{budgetCap.toFixed(2)} / day</div>
          </div>
          <button
            type="button"
            onClick={() => setBudgetEnabled((value) => !value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${budgetEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-200'}`}
          >
            {budgetEnabled ? 'enabled' : 'disabled'}
          </button>
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

        {hiddenFoodsCount > 0 ? <p className="text-xs text-slate-500">{hiddenFoodsCount} foods hidden due to your allergy settings.</p> : null}
        {error ? <Alert variant="warning">{error}</Alert> : null}
        {message ? <Alert variant="success">{message}</Alert> : null}

        {plan.map((planned) => {
          const mealFoods = planned.result.solution
            .map((item) => ({ foodId: item.foodId, grams: item.grams, food: allFoods.find((food) => food.id === item.foodId) }))
            .filter((entry) => entry.food)
          const allergens = Array.from(new Set(mealFoods.flatMap(({ food }) => food?.allergenTags ?? [])))
          const micros = calculateMealMicrosFromItems(
            mealFoods.map(({ food, grams }) => ({ amountInGrams: grams, food: food ?? undefined })),
          )
          const isExpanded = expandedMeals[planned.mealType] ?? false

          return (
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

              <div className="mt-2 space-y-1 rounded-md border border-slate-800 bg-slate-950/60 p-2 text-[11px] text-slate-300">
                <div className="flex items-center justify-between"><span>Price</span><strong className="text-emerald-300">€{planned.result.totalCost.toFixed(2)}</strong></div>
                <div className="flex items-center justify-between"><span>Budget</span><strong>{`€${planned.result.totalCost.toFixed(2)} / €${budgetCap.toFixed(2)}`}</strong></div>
                <div className="flex items-center justify-between"><span>Allergens</span><span className="text-right text-amber-300">{allergens.length > 0 ? allergens.join(', ') : 'none'}</span></div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                P {Math.round(planned.result.totalMacros.protein)} g · C {Math.round(planned.result.totalMacros.carbs)} g · F{' '}
                {Math.round(planned.result.totalMacros.fat)} g
              </p>

              <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/50 p-3">
                <button type="button" className="flex w-full items-center justify-between text-left text-[10px] font-medium uppercase tracking-[0.12em] text-slate-300" onClick={() => setExpandedMeals((current) => ({ ...current, [planned.mealType]: !isExpanded }))}>
                  <span>Meal micros</span>
                  <span>{isExpanded ? '−' : '+'}</span>
                </button>
                {isExpanded ? (
                  <div className="mt-3 space-y-2">
                    {MICRONUTRIENT_KEYS.filter((key) => (resolveMicronutrientTargets(profile)[key] ?? 0) > 0).map((key) => {
                      const target = resolveMicronutrientTargets(profile)[key]
                      const value = micros[key] ?? 0
                      const percent = getMicronutrientProgress(value, target)
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400"><span>{key === 'sodiumMg' ? 'Sodium' : key === 'potassiumMg' ? 'Potassium' : key === 'magnesiumMg' ? 'Magnesium' : key === 'calciumMg' ? 'Calcium' : key === 'zincMg' ? 'Zinc' : key === 'ironMg' ? 'Iron' : key === 'seleniumMcg' ? 'Selenium' : key === 'vitaminDMcg' ? 'Vitamin D' : key === 'vitaminB6Mg' ? 'Vitamin B6' : key === 'vitaminB12Mcg' ? 'Vitamin B12' : 'Vitamin C'}</span><span>{value.toFixed(0)}/{target.toFixed(0)}</span></div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, percent)}%` }} /></div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => void logPlannedMeal(planned)}>
                <Plus className="mr-2 h-4 w-4" />
                Log this meal
              </Button>
            </div>
          )
        })}

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
