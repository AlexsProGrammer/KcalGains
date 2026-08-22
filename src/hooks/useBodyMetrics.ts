import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { ProfileSchema } from '@/schemas/profile.schema'
import { calculateEnergyNeeds } from '@/services/energyNeedsService'
import { bmiCategory, calculateBMI, idealWeightRange } from '@/utils/bodyMetrics'
import type { Profile } from '@/types'

const fallbackProfile: Profile = ProfileSchema.parse({
  id: 'default-profile',
  targetCalories: 2000,
  targetMacros: { protein: 150, carbs: 200, fat: 65 },
  weightKg: 75,
  heightCm: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  goalRateKgPerWeek: 0,
})

export function useBodyMetrics() {
  const profile = useLiveQuery(async () => (await db.profile.toCollection().first()) ?? fallbackProfile, [])
  const settings = useLiveQuery(() => db.settings.get('app-settings'), [])
  const latestWeightEntry = useLiveQuery(() => db.weightLogs.orderBy('date').reverse().first(), [])

  const activeWeightKg =
    settings && settings.autoWeightFromLogs && latestWeightEntry
      ? latestWeightEntry.weightKg
      : profile?.weightKg ?? fallbackProfile.weightKg ?? 75

  const heightCm = profile?.heightCm ?? fallbackProfile.heightCm ?? 175
  const bmi = calculateBMI(activeWeightKg, heightCm)
  const idealRange = idealWeightRange(heightCm)
  const energy = calculateEnergyNeeds(profile ?? fallbackProfile, activeWeightKg)

  return {
    profile: profile ?? fallbackProfile,
    settings,
    latestWeightEntry,
    weightKg: activeWeightKg,
    heightCm,
    bmi,
    bmiLabel: bmiCategory(bmi),
    idealRange,
    ...energy,
  }
}
