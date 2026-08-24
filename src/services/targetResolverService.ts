import { DEFAULT_APP_SETTINGS } from '@/schemas/settings.schema'
import { calculateEnergyNeeds } from '@/services/energyNeedsService'
import type { AppSettings } from '@/types'
import type { Profile } from '@/types'

export type TargetSource = 'goal' | 'manual'

export type ResolvedDailyTargets = {
  calories: number
  protein: number
  carbs: number
  fat: number
  source: TargetSource
}

export function resolveDailyTargets({
  profile,
  settings = DEFAULT_APP_SETTINGS,
  recentWeightKg,
  isWorkoutDay = false,
  workoutType,
}: {
  profile?: Profile | null
  settings?: AppSettings | null
  recentWeightKg?: number
  isWorkoutDay?: boolean
  workoutType?: string
}): ResolvedDailyTargets {
  const baseProfile = profile ?? {
    id: 'default-profile',
    targetCalories: 2000,
    targetMacros: { protein: 150, carbs: 200, fat: 65 },
    heightCm: 175,
    weightKg: 75,
    activityLevel: 'moderate',
    goal: 'maintain',
    dietaryPattern: 'standard',
    sweatType: 'normal',
    allergens: [],
    goalRateKgPerWeek: 0,
  }

  const shouldUseGoalTargets = settings?.moduleChaining !== false && settings?.autoTargetsFromGoal !== false

  const derived = shouldUseGoalTargets
    ? calculateEnergyNeeds(baseProfile, recentWeightKg ?? baseProfile.weightKg ?? 75)
    : {
        recommendedIntake: baseProfile.targetCalories,
        targetMacros: {
          protein: baseProfile.targetMacros.protein,
          carbs: baseProfile.targetMacros.carbs,
          fat: baseProfile.targetMacros.fat,
        },
      }

  const adjusted = {
    calories: derived.recommendedIntake,
    protein: derived.targetMacros.protein,
    carbs: derived.targetMacros.carbs,
    fat: derived.targetMacros.fat,
  }

  if (isWorkoutDay) {
    const multiplier = workoutType === 'cardio' ? 1.2 : 1
    adjusted.calories += 250 * multiplier
    adjusted.protein += 10
    adjusted.carbs += 40 * multiplier
  }

  return {
    ...adjusted,
    source: shouldUseGoalTargets ? 'goal' : 'manual',
  }
}
