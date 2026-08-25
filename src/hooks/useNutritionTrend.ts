import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { DEFAULT_APP_SETTINGS } from '@/schemas/settings.schema'
import { aggregateMealsForDate, getRecentNutritionTrend } from '@/services/nutritionAggregationService'
import { resolveDailyTargets } from '@/services/targetResolverService'

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function useNutritionTrend(days = 30) {
  const meals = useLiveQuery(() => db.meals.toArray(), [], [])
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray(), [], [])
  const workouts = useLiveQuery(() => db.workouts.toArray(), [], [])
  const trainingContext = useLiveQuery(() => db.trainingContext.toArray(), [], [])
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [], null)
  const settings = useLiveQuery(() => db.settings.get('app-settings') ?? DEFAULT_APP_SETTINGS, [], DEFAULT_APP_SETTINGS)

  const trend = meals && dailyLogs && workouts && trainingContext && profile !== undefined && settings
    ? (() => {
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - days + 1)
        const range: string[] = []
        const cursor = new Date(startDate)
        while (cursor <= today) {
          range.push(toDateKey(cursor))
          cursor.setDate(cursor.getDate() + 1)
        }

        const logsMap = new Map(dailyLogs.map((log) => [log.date, log]))
        const contextMap = new Map(trainingContext.map((entry) => [entry.date, entry]))
        const workoutMap = new Map<string, boolean>()
        for (const workout of workouts) {
          if (typeof workout.date === 'string' && workout.date) {
            workoutMap.set(workout.date, true)
          }
        }

        return range.map((date) => {
          const log = logsMap.get(date)
          const context = contextMap.get(date)
          const isWorkoutDay = workoutMap.get(date) || Boolean(context && context.sportType !== 'rest')
          const resolved = resolveDailyTargets({
            profile,
            settings,
            recentWeightKg: profile?.weightKg,
            isWorkoutDay,
            trainingContext: context,
          })
          const aggregated = aggregateMealsForDate(meals, date, log)
          return {
            ...aggregated,
            targetCalories: resolved.calories,
            targetProtein: resolved.protein,
            targetCarbs: resolved.carbs,
            targetFat: resolved.fat,
          }
        })
      })()
    : []

  return { trend, isLoading: meals === undefined || dailyLogs === undefined || workouts === undefined || trainingContext === undefined || profile === undefined || settings === undefined }
}
