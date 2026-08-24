import { DEFAULT_APP_SETTINGS } from '@/schemas/settings.schema'
import { calculateEnergyNeeds } from '@/services/energyNeedsService'
import { resolveSportsPeriodization } from '@/services/sportsPeriodizationService'
import type { AppSettings, Profile, TrainingDayContext } from '@/types'

export type TargetSource = 'goal' | 'manual'

export type ResolvedDailyTargets = {
  calories: number
  protein: number
  carbs: number
  fat: number
  source: TargetSource
  reason?: string
}

export function resolveDailyTargets({
  profile,
  settings = DEFAULT_APP_SETTINGS,
  recentWeightKg,
  isWorkoutDay = false,
  workoutType,
  trainingContext,
}: {
  profile?: Profile | null
  settings?: AppSettings | null
  recentWeightKg?: number
  isWorkoutDay?: boolean
  workoutType?: string
  trainingContext?: Partial<TrainingDayContext> | null
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

  const fallbackSportType = workoutType === 'strength' || workoutType === 'hypertrophy' || workoutType === 'cardio' || workoutType === 'mma' || workoutType === 'combat_sport' || workoutType === 'endurance' || workoutType === 'rest'
    ? workoutType
    : 'strength'

  const fallbackContext: Partial<TrainingDayContext> = {
    sportType: fallbackSportType,
    seasonPhase: 'offseason',
    intensity: 'moderate',
  }

  const effectiveContext = trainingContext ?? (isWorkoutDay ? fallbackContext : null)
  const adjustment = resolveSportsPeriodization(effectiveContext, recentWeightKg ?? baseProfile.weightKg ?? 75)

  if (effectiveContext && effectiveContext.sportType !== 'rest') {
    adjusted.calories += adjustment.caloriesDelta
    adjusted.protein += adjustment.proteinDelta
    adjusted.carbs += adjustment.carbsDelta
    adjusted.fat += adjustment.fatDelta
  }

  return {
    ...adjusted,
    source: shouldUseGoalTargets ? 'goal' : 'manual',
    reason: adjustment.reason,
  }
}
