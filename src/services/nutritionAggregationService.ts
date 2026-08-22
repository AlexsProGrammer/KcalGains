import type { Meal, DailyLog } from '@/types'

export type DailyNutrition = {
  date: string
  caloriesConsumed: number
  proteinConsumed: number
  carbsConsumed: number
  fatConsumed: number
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

/**
 * Aggregate meals for a specific date into daily nutrition totals.
 */
export function aggregateMealsForDate(meals: Meal[], date: string, dailyLog?: DailyLog): DailyNutrition {
  const mealsForDate = meals.filter((m) => m.date === date)

  const consumed = mealsForDate.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return {
    date,
    caloriesConsumed: consumed.calories,
    proteinConsumed: consumed.protein,
    carbsConsumed: consumed.carbs,
    fatConsumed: consumed.fat,
    targetCalories: dailyLog?.targetCalories ?? 2000,
    targetProtein: dailyLog?.targetProtein ?? 160,
    targetCarbs: dailyLog?.targetCarbs ?? 200,
    targetFat: dailyLog?.targetFat ?? 65,
  }
}

/**
 * Generate daily nutrition trend from a date range of meals and logs.
 */
export function generateNutritionTrend(
  meals: Meal[],
  dailyLogs: DailyLog[],
  startDate: string,
  endDate: string,
): DailyNutrition[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }

  const logsMap = new Map(dailyLogs.map((log) => [log.date, log]))

  return dates.map((date) => aggregateMealsForDate(meals, date, logsMap.get(date)))
}

/**
 * Calculate the last N days of nutrition trend (defaults to 30).
 */
export function getRecentNutritionTrend(meals: Meal[], dailyLogs: DailyLog[], days = 30): DailyNutrition[] {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days + 1)

  return generateNutritionTrend(
    meals,
    dailyLogs,
    startDate.toISOString().slice(0, 10),
    today.toISOString().slice(0, 10),
  )
}
