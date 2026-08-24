import { useMemo, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, Dumbbell, Flame, Target, TrendingUp, Trophy } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ProgressBar, ProgressRing } from '@/components/ui/progress'
import { db } from '@/db'
import { useDynamicTargets } from '@/hooks/useDynamicTargets'
import { useNutritionTrend } from '@/hooks/useNutritionTrend'
import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'
import { MealMicronutrientSummary } from '@/components/nutrition/MealMicronutrientSummary'
import type { Meal } from '@/types'

const formatDate = (value: Date) => value.toISOString().slice(0, 10)

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
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()))
  const { settings } = useSettings()
  const { profile } = useProfile()
  const { targets, source } = useDynamicTargets()
  const { trend } = useNutritionTrend(7)

  const selected = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate])

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
    const date = getDayStart(selected)
    date.setDate(date.getDate() + offset)
    setSelectedDate(formatDate(date))
  }

  const renderHero = () => {
    if (settings.todayHero === 'weight') {
      return (
        <Card className="p-0 overflow-hidden">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">Weight / BMI</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-semibold text-ink-hi num">{profile.weightKg ?? '--'}kg</span>
                <span className="text-sm text-ink-mid">BMI {bmi ? bmi.toFixed(1) : '--'}</span>
              </div>
              <ProgressBar className="mt-5" value={Math.min(100, ((bmi ?? 22) / 30) * 100)} color="accent" />
              <div className="mt-2 flex justify-between text-[11px] text-ink-low">
                <span>Healthy range</span>
                <span>18.5–24.9</span>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface-0 p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-low">Diet</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-ink-mid">Calories</span>
                  <span className="num font-medium text-ink-hi">{totals.calories}/{targets.calories}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-mid">Protein</span>
                  <span className="num font-medium text-ink-hi">{totals.protein}/{targets.protein}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-mid">Carbs</span>
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
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ['Calories', `${totals.calories}/${targets.calories}`],
              ['Protein', `${totals.protein}/${targets.protein}g`],
              ['Carbs', `${totals.carbs}/${targets.carbs}g`],
              ['Fat', `${totals.fat}/${targets.fat}g`],
              ['Streak', `${streakValue}/7 days`],
              ['Workouts', `${workoutCount}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-surface-0 p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-low">{label}</p>
                <p className="mt-2 text-xl font-semibold text-ink-hi num">{value}</p>
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
                <p className="text-[10px] uppercase tracking-[0.14em] text-accent-text">7-day adherence</p>
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">Calories</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-ink-hi num">{totals.calories}</span>
                <span className="text-sm text-ink-mid">/ {targets.calories}</span>
              </div>
              <p className={`mt-2 text-sm ${caloriesRemaining >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {caloriesRemaining >= 0 ? `${caloriesRemaining} remaining` : `${Math.abs(caloriesRemaining)} over`}
              </p>
            </div>
          </div>

          <div className="w-full max-w-md space-y-3">
            {[
              ['Protein', totals.protein, targets.protein],
              ['Carbs', totals.carbs, targets.carbs],
              ['Fat', totals.fat, targets.fat],
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => goToDay(-1)} aria-label="Previous day">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(formatDate(new Date()))} aria-label="Today">
            <Activity className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => goToDay(1)} aria-label="Next day">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="rounded-full border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-hi">
          {buildDateLabel(selected)}
        </div>
      </div>

      {renderHero()}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader icon={<Flame />} title="Today meals" />
          <CardContent className="space-y-4">
            {groupedMeals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
                No meals logged for this day yet.
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
                      <div key={entry.id} className="rounded-xl border border-line bg-surface-0 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-ink-hi">{entry.mealType}</span>
                          <span className="num text-xs text-ink-mid">{entry.totalCalories} kcal</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-mid">
                          <span>P {entry.totalProtein}g</span>
                          <span>C {entry.totalCarbs}g</span>
                          <span>F {entry.totalFat}g</span>
                        </div>
                        <MealMicronutrientSummary meal={entry} profile={profile} compact />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader icon={<Dumbbell />} title="Workout" />
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">Active sessions</span>
                <span className="num text-ink-hi">{workoutCount}</span>
              </div>
              <div className="rounded-xl border border-line bg-surface-0 p-3 text-sm text-ink-mid">
                {workoutCount > 0 ? 'A workout is already logged for today.' : 'No workouts logged yet today.'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={<Target />} title="Targets" />
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">Source</span>
                <span className="text-ink-hi capitalize">{source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">Calories</span>
                <span className="num text-ink-hi">{targets.calories}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">Protein</span>
                <span className="num text-ink-hi">{targets.protein}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mid">Carbs</span>
                <span className="num text-ink-hi">{targets.carbs}g</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader icon={<TrendingUp />} title="Quick stats" />
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-ink-mid">TDEE</span><span className="num text-ink-hi">{toNumber(profile.targetCalories, 2200)}</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-mid">Weight</span><span className="num text-ink-hi">{profile.weightKg ?? '--'} kg</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-mid">Streak</span><span className="num text-ink-hi">{streakValue} days</span></div>
          </CardContent>
        </Card>

        {profileComplete ? null : (
          <Card className="md:col-span-2">
            <CardHeader icon={<Target />} title="Setup checklist" />
            <CardContent className="space-y-3 text-sm">
              {!profile.heightCm ? <div>• Add your height to unlock BMI and calorie estimates.</div> : null}
              {!profile.weightKg ? <div>• Add your current weight so trend and goals stay aligned.</div> : null}
              {!profile.birthYear ? <div>• Add your birth year to finish the profile.</div> : null}
              {!profile.sex ? <div>• Choose your sex to enable the rest of the profile logic.</div> : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
