import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarRange, ChartColumn, Dumbbell, Plus, Star, Trash2, UtensilsCrossed } from 'lucide-react'
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
import { useT } from '@/i18n'
import { addFavoriteMeal, readFavoriteMeals, removeFavoriteMeal } from '@/services/favoritesService'
import type { Meal } from '@/types'

function FavoritesTab() {
  const { t } = useT()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState(() => readFavoriteMeals())

  useEffect(() => {
    setFavorites(readFavoriteMeals())
  }, [])

  function addToLog(favoriteMeal: (typeof favorites)[number]) {
    const savedMeal: Meal = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      mealType: favoriteMeal.mealType,
      items: favoriteMeal.items,
      totalCalories: favoriteMeal.totalCalories,
      totalProtein: favoriteMeal.totalProtein,
      totalCarbs: favoriteMeal.totalCarbs,
      totalFat: favoriteMeal.totalFat,
      totalMicros: favoriteMeal.totalMicros,
    }

    void db.meals.add(savedMeal)
    setFavorites(readFavoriteMeals())
  }

  function useInBalancer(favoriteMeal: (typeof favorites)[number]) {
    window.sessionStorage.setItem('kcalgains.balancerTemplate', JSON.stringify({
      targetMealType: favoriteMeal.mealType,
      items: favoriteMeal.items,
    }))
    navigate('/nutrition?tab=balance', { replace: true })
  }

  return (
    <Card>
      <CardHeader icon={<Star />} title={t.nutrition.favoriteMeals} />
      <CardContent className="space-y-3">
        {favorites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
            {t.nutrition.noFavorites}
          </div>
        ) : null}

        {favorites.map((favorite) => (
          <div key={favorite.id} className="rounded-xl border border-line bg-surface-0 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium capitalize text-ink-hi">{favorite.label}</div>
                <div className="mt-1 text-[11px] text-ink-mid">{favorite.mealType} • {favorite.totalCalories} kcal</div>
              </div>
              <button type="button" className="text-xs text-ink-mid hover:text-danger" onClick={() => { removeFavoriteMeal(favorite.id); setFavorites(readFavoriteMeals()) }}>{t.nutrition.remove}</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => useInBalancer(favorite)}>{t.nutrition.useInBalancer}</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => addToLog(favorite)}>{t.nutrition.addToLog}</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function NutritionPage() {
  const { t } = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'log'
  const today = new Date().toISOString().slice(0, 10)
  const { targets } = useDynamicTargets(today)
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

  const tabs = [
    { value: 'log', label: t.nutrition.log },
    { value: 'favorites', label: t.nutrition.favorites },
    { value: 'barcode', label: t.nutrition.barcode },
    { value: 'micros', label: t.nutrition.micros },
    { value: 'plan', label: t.nutrition.plan },
    { value: 'balance', label: t.nutrition.balance },
    { value: 'library', label: t.nutrition.library },
  ]

  const formatMacro = (value: number) => Number(value).toFixed(2)

  const activeTab = tabs.some((entry) => entry.value === tab) ? tab : 'log'

  const handleTabChange = (nextValue: string) => {
    setSearchParams({ tab: nextValue }, { replace: true })
  }

  async function updateMeal(meal: Meal, patch: Partial<Meal>) {
    await db.meals.put({ ...meal, ...patch })
    setSuccessMessage(t.nutrition.mealUpdated)
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
    setSuccessMessage(t.nutrition.mealRemoved)
  }

  function handleFavoriteMeal(meal: Meal) {
    addFavoriteMeal(meal, `${meal.mealType} meal`)
    setSuccessMessage(t.nutrition.savedFavorite)
  }

  function handleUseInBalancer(meal: Meal) {
    window.sessionStorage.setItem('kcalgains.balancerTemplate', JSON.stringify({
      targetMealType: meal.mealType,
      items: meal.items,
    }))
    setSearchParams({ tab: 'balance' }, { replace: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">{t.nav.nutrition}</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink-hi">{t.nutrition.pageTitle}</h2>
        </div>
        <SegmentedControl value={activeTab} onValueChange={handleTabChange} items={tabs} />
      </div>

      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <Card className="min-w-0">
          <CardHeader icon={<UtensilsCrossed className="h-3.5 w-3.5" />} title={t.common.calories} className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {formatMacro(totals.calories)}
            <span className="ml-1 text-[11px] text-ink-mid">/ {targets.calories}</span>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<ChartColumn className="h-3.5 w-3.5" />} title={t.common.protein} className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {formatMacro(totals.protein)}
            <span className="ml-1 text-[11px] text-ink-mid">g</span>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<CalendarRange className="h-3.5 w-3.5" />} title={t.common.carbs} className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {formatMacro(totals.carbs)}
            <span className="ml-1 text-[11px] text-ink-mid">g</span>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<Dumbbell className="h-3.5 w-3.5" />} title={t.common.fat} className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-base font-semibold text-ink-hi num sm:text-lg">
            {formatMacro(totals.fat)}
            <span className="ml-1 text-[11px] text-ink-mid">g</span>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'log' ? (
        <Card>
          <CardHeader
            icon={<UtensilsCrossed />}
            title={t.nutrition.todayLog}
            actions={
              <Button type="button" size="sm" variant="secondary" onClick={openAddMeal}>
                <Plus className="h-4 w-4" />
                {t.nutrition.addMeal}
              </Button>
            }
          />
          <CardContent className="space-y-3">
            {meals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
                {t.nutrition.noMeals}
              </div>
            ) : (
              meals.map((meal) => (
                <MealLogCard
                  key={meal.id}
                  meal={meal}
                  profile={profile}
                  onEdit={openEditMeal}
                  onDelete={handleDeleteMeal}
                  onFavorite={handleFavoriteMeal}
                  onUseInBalancer={handleUseInBalancer}
                />
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'favorites' ? <FavoritesTab /> : null}
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
