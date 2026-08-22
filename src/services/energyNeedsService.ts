import { ACTIVITY_MULTIPLIERS, GOAL_DEFAULT_RATES, ProfileSchema } from '@/schemas/profile.schema'
import type { Profile } from '@/types'

export type EnergyNeedsResult = {
  bmr: number
  tdee: number
  goalDeltaKcal: number
  recommendedIntake: number
  targetMacros: {
    protein: number
    carbs: number
    fat: number
  }
}

export function calculateEnergyNeeds(profile: Profile, bodyWeightKg = profile.weightKg ?? 70): EnergyNeedsResult {
  const safeProfile = ProfileSchema.parse(profile)
  const weight = Number.isFinite(bodyWeightKg) && bodyWeightKg > 0 ? bodyWeightKg : safeProfile.weightKg ?? 70
  const height = safeProfile.heightCm ?? 175
  const birthYear = safeProfile.birthYear ?? 1990
  const age = Math.max(18, new Date().getFullYear() - birthYear)
  const sex = safeProfile.sex ?? 'male'
  const activityLevel = safeProfile.activityLevel ?? 'moderate'

  const bmr = sex === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel]
  const goalRate = safeProfile.goalRateKgPerWeek ?? GOAL_DEFAULT_RATES[safeProfile.goal ?? 'maintain'] ?? 0
  const goalDeltaKcal = (goalRate * 7700) / 7
  const recommendedIntake = Math.max(1200, Math.round(tdee + goalDeltaKcal))

  const protein = Math.round(Math.max(1.6 * weight, safeProfile.goal === 'gain-muscle' ? 1.8 * weight : 1.6 * weight))
  const fat = Math.round(Math.max(0.8 * weight, 45))
  const carbs = Math.max(0, Math.round((recommendedIntake - protein * 4 - fat * 9) / 4))

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    goalDeltaKcal: Math.round(goalDeltaKcal),
    recommendedIntake,
    targetMacros: {
      protein,
      carbs,
      fat,
    },
  }
}
