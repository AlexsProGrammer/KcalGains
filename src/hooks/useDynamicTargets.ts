import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { ProfileSchema } from '@/schemas/profile.schema'
import { getAdjustedDailyTargets, type DynamicMacroTargets } from '@/services/dynamicTargetService'
import type { Profile } from '@/types'

const fallbackProfile: Profile = ProfileSchema.parse({ id: 'default', targetCalories: 2000, targetMacros: { protein: 120, carbs: 220, fat: 65 } })

export function useDynamicTargets(): DynamicMacroTargets & { isWorkoutDay: boolean } {
  const state = useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const profile = await db.profile.toCollection().first()
    const workouts = await db.workouts.toArray()
    const isWorkoutDay = workouts.some((workout) => 'date' in workout && workout.date === today)
    return { targets: getAdjustedDailyTargets(profile ?? fallbackProfile, isWorkoutDay), isWorkoutDay }
  }, [], { targets: getAdjustedDailyTargets(fallbackProfile, false), isWorkoutDay: false })
  return { ...state.targets, isWorkoutDay: state.isWorkoutDay }
}
