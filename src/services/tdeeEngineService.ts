import { TdeeCalculationResultSchema } from '@/schemas/tdee.schema'
import { calculateWeightEMA } from '@/utils/emaCalculations'
import type { DailyLog, WeightEntry, TdeeCalculationResult } from '@/types'

const kcalPerKg = 7700

export function computeAdaptiveTDEE(weightLogs: WeightEntry[], dailyCalorieLogs: DailyLog[], windowDays = 21): TdeeCalculationResult {
  const trend = calculateWeightEMA(weightLogs).slice(-Math.max(2, windowDays))
  const relevantDates = new Set(trend.map((entry) => entry.date))
  const calories = dailyCalorieLogs.filter((log) => relevantDates.has(log.date)).map((log) => log.caloriesConsumed ?? log.targetCalories)
  const averageCalories = calories.length > 0 ? calories.reduce((total, value) => total + value, 0) / calories.length : 0
  const first = trend[0]
  const last = trend[trend.length - 1]
  const days = trend.length > 1 ? Math.max(1, Math.round((Date.parse(`${last.date}T00:00:00Z`) - Date.parse(`${first.date}T00:00:00Z`)) / 86400000)) : 1
  const weightDelta = first && last ? last.smoothedWeightKg - first.smoothedWeightKg : 0
  const dailyEnergyDelta = weightDelta * kcalPerKg / days
  const calculatedTdee = Math.max(0, averageCalories - dailyEnergyDelta)
  const weeklyWeightDeltaKg = weightDelta / days * 7
  const confidenceScore = Math.min(1, calories.length / 14) * Math.min(1, trend.length / 7)
  const trendDirection = weeklyWeightDeltaKg > 0.05 ? 'rising' : weeklyWeightDeltaKg < -0.05 ? 'falling' : 'stable'

  return TdeeCalculationResultSchema.parse({
    calculatedTdee,
    trendDirection,
    weeklyWeightDeltaKg,
    confidenceScore,
    recommendedIntake: calculatedTdee,
  })
}
