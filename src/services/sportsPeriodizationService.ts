import type { TrainingDayContext } from '@/types'

export type SportsPeriodizationAdjustment = {
  caloriesDelta: number
  proteinDelta: number
  carbsDelta: number
  fatDelta: number
  sodiumMgDelta: number
  potassiumMgDelta: number
  reason: string
}

export function resolveSportsPeriodization(
  context?: Partial<TrainingDayContext> | null,
  bodyWeightKg = 75,
): SportsPeriodizationAdjustment {
  const sportType = context?.sportType ?? 'rest'
  const seasonPhase = context?.seasonPhase ?? 'offseason'
  const intensity = context?.intensity ?? 'moderate'

  const intensityFactor = intensity === 'low' ? 0.7 : intensity === 'high' ? 1.3 : 1

  let caloriesDelta = 0
  let proteinDelta = 0
  let carbsDelta = 0
  let fatDelta = 0
  let sodiumMgDelta = 0
  let potassiumMgDelta = 0

  switch (sportType) {
    case 'mma':
    case 'combat_sport':
      caloriesDelta = 420 * intensityFactor
      carbsDelta = 1.5 * bodyWeightKg * intensityFactor
      sodiumMgDelta = 500
      potassiumMgDelta = 250
      proteinDelta = 10
      break
    case 'strength':
      caloriesDelta = 180 * intensityFactor
      proteinDelta = 0.4 * bodyWeightKg
      carbsDelta = 0.8 * bodyWeightKg * intensityFactor
      potassiumMgDelta = 200
      break
    case 'cardio':
      caloriesDelta = 220 * intensityFactor
      carbsDelta = 1.1 * bodyWeightKg * intensityFactor
      sodiumMgDelta = 200
      potassiumMgDelta = 150
      break
    case 'endurance':
      caloriesDelta = 300 * intensityFactor
      carbsDelta = 1.4 * bodyWeightKg * intensityFactor
      sodiumMgDelta = 350
      potassiumMgDelta = 250
      break
    case 'hypertrophy':
      caloriesDelta = 220 * intensityFactor
      proteinDelta = 0.25 * bodyWeightKg
      carbsDelta = 1.0 * bodyWeightKg * intensityFactor
      break
    case 'rest':
    default:
      caloriesDelta = 0
      carbsDelta = 0
      proteinDelta = 0
      sodiumMgDelta = 0
      potassiumMgDelta = 0
      break
  }

  if (seasonPhase === 'competition') {
    caloriesDelta -= 500
  } else if (seasonPhase === 'offseason') {
    caloriesDelta += 250
  } else if (seasonPhase === 'competition_prep') {
    caloriesDelta += 150
  } else if (seasonPhase === 'recovery') {
    caloriesDelta -= 150
  }

  const sportLabel =
    sportType === 'mma'
      ? 'MMA'
      : sportType === 'combat_sport'
        ? 'Combat sport'
        : sportType === 'strength'
          ? 'Strength'
          : sportType === 'cardio'
            ? 'Cardio'
            : sportType === 'hypertrophy'
              ? 'Hypertrophy'
              : sportType === 'endurance'
                ? 'Endurance'
                : 'Rest'

  const reason =
    sportType === 'rest'
      ? 'Baseline daily targets (rest day)'
      : `Adjusted for ${sportLabel} session (+${Math.round(caloriesDelta)} kcal, +${Math.round(carbsDelta)}g carbs)`

  return {
    caloriesDelta: Number(caloriesDelta.toFixed(1)),
    proteinDelta: Number(proteinDelta.toFixed(1)),
    carbsDelta: Number(carbsDelta.toFixed(1)),
    fatDelta: Number(fatDelta.toFixed(1)),
    sodiumMgDelta: Number(sodiumMgDelta.toFixed(1)),
    potassiumMgDelta: Number(potassiumMgDelta.toFixed(1)),
    reason,
  }
}
