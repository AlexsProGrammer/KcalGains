import type { Profile } from '@/types'

export type DynamicMacroTargets = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function getAdjustedDailyTargets(baseProfile: Profile, isWorkoutDay: boolean, workoutType?: string): DynamicMacroTargets {
  const base = {
    calories: baseProfile.targetCalories,
    protein: baseProfile.targetMacros.protein,
    carbs: baseProfile.targetMacros.carbs,
    fat: baseProfile.targetMacros.fat,
  }

  if (!isWorkoutDay) return base

  const multiplier = workoutType === 'cardio' ? 1.2 : 1
  return {
    calories: base.calories + 250 * multiplier,
    protein: base.protein + 10,
    carbs: base.carbs + 40 * multiplier,
    fat: base.fat,
  }
}
