import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, Dumbbell, Flame, Plus, Target, Trash2, TrendingUp, Trophy } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ProgressBar, ProgressRing } from '@/components/ui/progress'
import { db } from '@/db'
import { useDynamicTargets } from '@/hooks/useDynamicTargets'
import { useNutritionTrend } from '@/hooks/useNutritionTrend'
import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'
import { useT } from '@/i18n'
import { MealLogCard } from '@/components/nutrition/MealLogCard'
import { WeightQuickAddModal } from '@/components/analytics/WeightQuickAddModal'
import type { Meal } from '@/types'

const formatDate = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function getDayStart(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function buildDateLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', weekday: 'short' }).format(date)
}

function toNumber(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? value! : fallback
}

export function TodayPage() {
  const { t } = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()))
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(searchParams.get('weight') === 'quick-add')
  const todayKey = formatDate(new Date())

  useEffect(() => {
    setQuickAddOpen(searchParams.get('weight') === 'quick-add')
  }, [searchParams])
  const { settings } = useSettings()
  const { profile } = useProfile()
  const { targets, source } = useDynamicTargets(selectedDate)
  const { trend } = useNutritionTrend(7)

  const selected = useMemo(() => parseDateKey(selectedDate), [selectedDate])

  const meals = useLiveQuery(() => db.meals.where('date').equals(selectedDate).toArray(), [selectedDate], []) as Meal[]
  const workoutCount = useLiveQuery(() => db.workouts.where('date').equals(selectedDate).count(), [selectedDate], 0)
  const dayLog = useLiveQuery(() => db.dailyLogs.get(selectedDate), [selectedDate])

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProtein,
        carbs: acc.carbs + meal.totalCarbs,
        fat: acc.fat + meal.totalFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [meals])

  const caloriesRemaining = targets.calories - totals.calories
  const calorieProgress = Math.min((totals.calories / Math.max(targets.calories, 1)) * 100, 100)
  const streakValue = trend.filter((day) => day.caloriesConsumed >= day.targetCalories * 0.8).length

  const groupedMeals = useMemo(() => {
    const byType = new Map<string, Meal[]>()
    for (const meal of meals) {
      const bucket = byType.get(meal.mealType) ?? []
      bucket.push(meal)
      byType.set(meal.mealType, bucket)
    }

    return [...mealOrder]
      .map((mealType) => ({ mealType, meals: byType.get(mealType) ?? [] }))
      .filter((entry) => entry.meals.length > 0)
  }, [meals])

  const bmi = useMemo(() => {
    if (!profile.weightKg || !profile.heightCm) return null
    const heightMeters = profile.heightCm / 100
    return profile.weightKg / (heightMeters * heightMeters)
  }, [profile.heightCm, profile.weightKg])

  const goToDay = (offset: number) => {
    const nextDate = getDayStart(selected)
    const candidate = new Date(nextDate)
    candidate.setDate(candidate.getDate() + offset)
    const nextKey = formatDate(candidate)

    if (nextKey > todayKey) return

    setSelectedDate(nextKey)
  }

  const closeQuickAdd = () => {
    setQuickAddOpen(false)
    const next = new URLSearchParams(searchParams)
    next.delete('weight')
    setSearchParams(next, { replace: true })
  }

  async function updateMeal(meal: Meal, patch: Partial<Meal>) {
    await db.meals.put({ ...meal, ...patch })
    setSuccessMessage(t.today.mealUpdated)
  }

  async function handleDeleteMeal(mealId: string) {
    await db.meals.delete(mealId)
    setSuccessMessage(t.today.mealRemoved)
  }

  const renderHero = () => {
    if (settings.todayHero === 'weight') {
      return (
        <Card className="p-0 overflow-hidden">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">{t.today.heroWeight}</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-semibold text-ink-hi num">{profile.weightKg ?? '--'}kg</span>
                <span className="text-sm text-ink-mid">BMI {bmi ? bmi.toFixed(1) : '--'}</span>
              </div>
              <ProgressBar className="mt-5" value={Math.min(100, ((bmi ?? 22) / 30) * 100)} color="accent" />
              <div className="mt-2 flex justify-between text-[11px] text-ink-low">
                <span>{t.today.healthyRange}</span>
                <span>18.5–24.9</span>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface-0 p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-low">{t.today.diet}</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-ink-mid">{t.today.calories}</span>
                  <span className="num font-medium text-ink-hi">{totals.calories}/{targets.calories}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-mid">{t.today.protein}</span>
                  <span className="num font-medium text-ink-hi">{totals.protein}/{targets.protein}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-mid">{t.today.carbs}</span>
                  <span className="num font-medium text-ink-hi">{totals.carbs}/{targets.carbs}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (settings.todayHero === 'stats') {
      return (
        <Card>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {[
              [t.today.calories, `${totals.calories}/${targets.calories}`],
              [t.today.protein, `${totals.protein}/${targets.protein}g`],
              [t.today.carbs, `${totals.carbs}/${targets.carbs}g`],
              [t.common.fat, `${totals.fat}/${targets.fat}g`],
              [t.today.streak, `${streakValue}/7d`],
              [t.train.sessions, `${workoutCount}`],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl border border-line bg-surface-0 p-3">
                <p className="text-[9px] uppercase tracking-[0.12em] text-ink-low">{label}</p>
                <p className="mt-1 text-base font-semibold text-ink-hi num sm:text-lg">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )
    }

    if (settings.todayHero === 'streak') {
      return (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-accent-text">{t.today.adherence}</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-hi">{streakValue}/7</h3>
              </div>
              <Trophy className="h-9 w-9 text-accent-text" />
            </div>
            <div className="flex gap-2">
              {trend.slice(-7).map((day, index) => {
                const active = day.caloriesConsumed >= day.targetCalories * 0.8
                return (
                  <div key={`${day.date}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                    <div className={`h-12 w-full rounded-full ${active ? 'bg-accent-fill' : 'bg-surface-2'}`} />
                    <span className="text-[10px] text-ink-low">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 p-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-5">
            <ProgressRing value={Math.max(0, Math.min(100, calorieProgress))} max={100} size={118} strokeWidth={10} color="accent" label="kcal" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">{t.today.calories}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-ink-hi num">{totals.calories}</span>
                <span className="text-sm text-ink-mid">/ {targets.calories}</span>
              </div>
              <p className={`mt-2 text-sm ${caloriesRemaining >= 0 ? 'text-accent-text' : 'text-warning'}`}>
                {caloriesRemaining >= 0 ? t.today.caloriesRemaining.replace('{value}', String(caloriesRemaining)) : t.today.caloriesOver.replace('{value}', String(Math.abs(caloriesRemaining)))}
              </p>
            </div>
          </div>

          <div className="w-full max-w-md space-y-3">
            {[
              [t.today.protein, totals.protein, targets.protein],
              [t.today.carbs, totals.carbs, targets.carbs],
              [t.common.fat, totals.fat, targets.fat],
            ].map(([label, current, target]) => (
              <div key={label as string}>
                <div className="mb-1 flex items-center justify-between text-xs text-ink-mid">
                  <span>{label}</span>
                  <span className="num">{current}/{target}g</span>
                </div>
                <ProgressBar value={Number(current) / Math.max(Number(target), 1) * 100} color="accent" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const profileComplete = Boolean(profile.heightCm && profile.weightKg && profile.birthYear && profile.sex)

  return (
    <div className="space-y-4">
      {successMessage ? <div className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-ink-hi">{successMessage}</div> : null}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => goToDay(-1)} aria-label={t.common.previousDay}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(todayKey)} aria-label={t.common.today}>
            <Activity className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => goToDay(1)} aria-label={t.common.nextDay} disabled={selectedDate >= todayKey}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="rounded-full border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-hi">
          {buildDateLabel(selected)}
        </div>
      </div>

      {renderHero()}

      <WeightQuickAddModal open={quickAddOpen} onClose={closeQuickAdd} defaultDate={selectedDate} />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader icon={<Flame />} title={t.today.todayMeals} />
          <CardContent className="space-y-4">
            {groupedMeals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
                {t.today.noMeals}
              </div>
            ) : (
              groupedMeals.map(({ mealType, meals: mealEntries }) => (
                <div key={mealType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-ink-hi">{mealType}</span>
                    <span className="text-xs uppercase tracking-[0.1em] text-ink-low">
                      {mealEntries.reduce((sum, meal) => sum + meal.totalCalories, 0)} kcal
                    </span>
                  </div>
                  <div className="space-y-2">
                    {mealEntries.map((entry) => (
                      <MealLogCard
                        key={entry.id}
                        meal={entry}
                        profile={profile}
                        onDelete={handleDeleteMeal}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader icon={<Dumbbell />} title={t.today.workout} />
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">{t.today.activeSessions}</span>
                <span className="num text-ink-hi">{workoutCount}</span>
              </div>
              <div className="rounded-xl border border-line bg-surface-0 p-3 text-sm text-ink-mid">
                {workoutCount > 0 ? t.today.workoutAlready : t.today.workoutNone}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={<Target />} title={t.today.targets} />
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">{t.common.source}</span>
                <span className="text-ink-hi capitalize">{source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">{t.today.calories}</span>
                <span className="num text-ink-hi">{targets.calories}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">{t.today.protein}</span>
                <span className="num text-ink-hi">{targets.protein}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">{t.today.carbs}</span>
                <span className="num text-ink-hi">{targets.carbs}g</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader icon={<TrendingUp />} title={t.today.quickStats} />
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-ink-mid">{t.today.tdee}</span><span className="num text-ink-hi">{toNumber(profile.targetCalories, 2200)}</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-mid">{t.today.weight}</span><span className="num text-ink-hi">{profile.weightKg ?? '--'} kg</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-mid">{t.today.streak}</span><span className="num text-ink-hi">{streakValue} {t.common.days}</span></div>
          </CardContent>
        </Card>

        {profileComplete ? null : (
          <Card className="md:col-span-2">
            <CardHeader icon={<Target />} title={t.today.setupChecklist} />
            <CardContent className="space-y-3 text-sm">
              {!profile.heightCm ? <div>• {t.today.setupHeight}</div> : null}
              {!profile.weightKg ? <div>• {t.today.setupWeight}</div> : null}
              {!profile.birthYear ? <div>• {t.today.setupBirthYear}</div> : null}
              {!profile.sex ? <div>• {t.today.setupSex}</div> : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
