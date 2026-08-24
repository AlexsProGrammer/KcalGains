import { db } from '@/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { CloudDownload, Database, FlaskConical, ScanLine, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { exportDatabaseToJson, importDatabaseFromJson } from '@/services/backupService'
import { useFoodSearch } from '@/hooks/useFoodSearch'
import { BarcodeScannerModal } from '@/components/food/BarcodeScannerModal'
import type { Food, Meal } from '@/types'

export async function runBackupRoundTripCheck(): Promise<boolean> {
  await Promise.all([
    db.foods.clear(),
    db.meals.clear(),
    db.workouts.clear(),
    db.dailyLogs.clear(),
    db.profile.clear(),
  ])

  const foods: Food[] = Array.from({ length: 10 }, (_, index) => ({
    id: `backup-check-food-${index + 1}`,
    name: `Backup check food ${index + 1}`,
    servingSize: 100,
    calories: 100 + index,
    protein: 10,
    carbs: 10,
    fat: 5,
    fiber: 2,
    allergenTags: [],
    price: undefined,
    costPer100g: undefined,
    currency: 'EUR',
    source: 'manual',
    notes: undefined,
    isCustom: true,
    createdAt: new Date().toISOString(),
  }))
  const meals: Meal[] = [1, 2].map((index) => ({
    id: `backup-check-meal-${index}`,
    date: '2026-08-21',
    mealType: index === 1 ? 'breakfast' : 'lunch',
    items: [{
      foodId: foods[index - 1].id,
      amountInGrams: 100,
      calories: foods[index - 1].calories,
      protein: foods[index - 1].protein,
      carbs: foods[index - 1].carbs,
      fat: foods[index - 1].fat,
    }],
    totalCalories: foods[index - 1].calories,
    totalProtein: foods[index - 1].protein,
    totalCarbs: foods[index - 1].carbs,
    totalFat: foods[index - 1].fat,
    totalMicros: {
      sodiumMg: 0,
      potassiumMg: 0,
      magnesiumMg: 0,
      calciumMg: 0,
      zincMg: 0,
      ironMg: 0,
      seleniumMcg: 0,
      vitaminDMcg: 0,
      vitaminB6Mg: 0,
      vitaminB12Mcg: 0,
      vitaminCMg: 0,
    },
  }))

  await db.foods.bulkAdd(foods)
  await db.meals.bulkAdd(meals)

  const payload = await exportDatabaseToJson()
  await Promise.all([
    db.foods.clear(),
    db.meals.clear(),
    db.workouts.clear(),
    db.dailyLogs.clear(),
    db.profile.clear(),
  ])

  const result = await importDatabaseFromJson(new File([JSON.stringify(payload)], 'backup-check.json', { type: 'application/json' }))

  if (!result.success) {
    return false
  }

  const [foodCount, mealCount] = await Promise.all([db.foods.count(), db.meals.count()])
  return foodCount === 10 && mealCount === 2 && result.counts.foods === 10 && result.counts.meals === 2
}

const emptyCounts = { foods: 0, meals: 0, workouts: 0, dailyLogs: 0, profile: 0 }

export function DatabaseDebugger() {
  const [message, setMessage] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const {
    cacheRemoteFood,
    isReady: isSearchReady,
    isRemoteSearching,
    isSearching,
    remoteError,
    remoteResults,
    results: searchResults,
    searchRemote,
  } = useFoodSearch(searchQuery)
  const liveData = useLiveQuery(async () => ({
    counts: {
      foods: await db.foods.count(),
      meals: await db.meals.count(),
      workouts: await db.workouts.count(),
      dailyLogs: await db.dailyLogs.count(),
      profile: await db.profile.count(),
    },
    foods: await db.foods.orderBy('createdAt').reverse().limit(5).toArray(),
    meals: await db.meals.orderBy('date').reverse().limit(5).toArray(),
  }), [], { counts: emptyCounts, foods: [], meals: [] })

  async function seedFoods() {
    const foods: Food[] = Array.from({ length: 5 }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Test food ${index + 1}`,
      servingSize: 100,
      calories: 100 + index * 20,
      protein: 10 + index,
      carbs: 12,
      fat: 4,
      fiber: 2,
      allergenTags: [],
      price: undefined,
      costPer100g: undefined,
      currency: 'EUR',
      source: 'manual',
      notes: undefined,
      isCustom: true,
      createdAt: new Date().toISOString(),
    }))

    await db.foods.bulkAdd(foods)
    setMessage('Seeded 5 test foods.')
  }

  async function seedMeal() {
    const food = await db.foods.toCollection().first()

    if (!food) {
      setMessage('Seed foods before creating a test meal.')
      return
    }

    const meal: Meal = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      mealType: 'lunch',
      items: [{
        foodId: food.id,
        amountInGrams: 100,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      }],
      totalCalories: food.calories,
      totalProtein: food.protein,
      totalCarbs: food.carbs,
      totalFat: food.fat,
      totalMicros: {
        sodiumMg: 0,
        potassiumMg: 0,
        magnesiumMg: 0,
        calciumMg: 0,
        zincMg: 0,
        ironMg: 0,
        seleniumMcg: 0,
        vitaminDMcg: 0,
        vitaminB6Mg: 0,
        vitaminB12Mcg: 0,
        vitaminCMg: 0,
      },
    }

    await db.meals.add(meal)
    setMessage('Seeded 1 test meal.')
  }

  async function clearDatabase() {
    await Promise.all([
      db.foods.clear(),
      db.meals.clear(),
      db.workouts.clear(),
      db.dailyLogs.clear(),
      db.profile.clear(),
    ])
    setMessage('Cleared all IndexedDB tables.')
  }

  const counts = liveData?.counts ?? emptyCounts

  return (
    <>
      <Card>
      <CardHeader icon={<Database />} title="Database debugger" />
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void seedFoods()}>
            <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" />
            Seed 5 foods
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => void seedMeal()}>
            <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" />
            Seed 1 meal
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void clearDatabase()}>
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Clear database
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setIsScannerOpen(true)}>
            <ScanLine className="mr-2 h-4 w-4" aria-hidden="true" />
            Scan barcode
          </Button>
        </div>

        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="debug-food-search">
            Search local foods
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              id="debug-food-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Try hafer, quark, or chicken"
              className="min-h-10 w-full rounded-md border border-slate-700 bg-slate-950/70 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {isSearching ? 'Searching...' : isSearchReady ? `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}` : 'Loading local index...'}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!searchQuery.trim() || isRemoteSearching}
              onClick={() => void searchRemote()}
            >
              <CloudDownload className="mr-2 h-4 w-4" aria-hidden="true" />
              {isRemoteSearching ? 'Searching Open Food Facts...' : 'Search Open Food Facts'}
            </Button>
            {remoteError ? <span className="text-xs text-amber-300">{remoteError}</span> : null}
          </div>
          {searchQuery.trim() && searchResults.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-800 rounded-md border border-slate-800">
              {searchResults.slice(0, 8).map((result) => (
                <li key={result.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-slate-200">
                    {result.name}{result.brand ? <span className="text-slate-500"> · {result.brand}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {result.calories} kcal · P {result.protein} · score {result.score.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : searchQuery.trim() && !isSearching ? (
            <p className="mt-3 text-sm text-slate-600">No local foods matched that query.</p>
          ) : null}
          {remoteResults.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open Food Facts results</h3>
              <ul className="mt-2 divide-y divide-slate-800 rounded-md border border-slate-800">
                {remoteResults.slice(0, 8).map((food) => (
                  <li key={food.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-slate-200">
                      {food.name}{food.brand ? <span className="text-slate-500"> · {food.brand}</span> : null}
                    </span>
                    <Button type="button" size="sm" onClick={() => void cacheRemoteFood(food).then(() => setMessage(`Cached ${food.name} locally.`))}>
                      Cache locally
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(counts).map(([table, count]) => (
            <div key={table} className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">{table}</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{count}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live foods</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {liveData?.foods.map((food) => <li key={food.id}>{food.name}</li>)}
              {liveData?.foods.length === 0 ? <li className="text-slate-600">No foods yet</li> : null}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live meals</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {liveData?.meals.map((meal) => <li key={meal.id}>{meal.date} · {meal.mealType}</li>)}
              {liveData?.meals.length === 0 ? <li className="text-slate-600">No meals yet</li> : null}
            </ul>
          </div>
        </div>
        {message ? <Alert className="mt-4" variant="info">{message}</Alert> : null}
      </CardContent>
      </Card>
      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onFoodResolved={(food) => {
          setMessage(`Resolved and cached ${food.name}.`)
          setIsScannerOpen(false)
        }}
      />
    </>
  )
}