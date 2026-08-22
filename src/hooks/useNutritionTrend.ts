import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { getRecentNutritionTrend } from '@/services/nutritionAggregationService'

export function useNutritionTrend(days = 30) {
  const meals = useLiveQuery(() => db.meals.toArray(), [], [])
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray(), [], [])

  const trend = meals && dailyLogs ? getRecentNutritionTrend(meals, dailyLogs, days) : []

  return { trend, isLoading: meals === undefined || dailyLogs === undefined }
}
