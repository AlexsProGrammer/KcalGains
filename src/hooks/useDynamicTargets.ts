import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { DEFAULT_APP_SETTINGS } from '@/schemas/settings.schema'
import { resolveDailyTargets } from '@/services/targetResolverService'
import type { DynamicMacroTargets } from '@/services/dynamicTargetService'

const fallbackSettings = DEFAULT_APP_SETTINGS

export function useDynamicTargets(): DynamicMacroTargets & {
  targets: DynamicMacroTargets
  isWorkoutDay: boolean
  source: 'goal' | 'manual'
  reason?: string
} {
  const state = useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const profile = await db.profile.toCollection().first()
    const settings = await db.settings.get('app-settings') ?? fallbackSettings
    const workouts = await db.workouts.toArray()
    const trainingContext = await db.trainingContext.where('date').equals(today).first()
    const isWorkoutDay = workouts.some((workout) => 'date' in workout && workout.date === today) || Boolean(trainingContext && trainingContext.sportType !== 'rest')
    const resolved = resolveDailyTargets({ profile, settings, recentWeightKg: profile?.weightKg, isWorkoutDay, trainingContext })

    return {
      targets: {
        calories: resolved.calories,
        protein: resolved.protein,
        carbs: resolved.carbs,
        fat: resolved.fat,
      },
      isWorkoutDay,
      source: resolved.source,
      reason: resolved.reason,
    }
  }, [], {
    targets: {
      calories: 2000,
      protein: 150,
      carbs: 220,
      fat: 65,
    },
    isWorkoutDay: false,
    source: 'goal',
    reason: 'Baseline daily targets',
  })

  const resolvedTargets = state?.targets ?? {
    calories: 2000,
    protein: 150,
    carbs: 220,
    fat: 65,
  }

  const source: 'goal' | 'manual' = state?.source === 'manual' ? 'manual' : 'goal'

  return {
    ...resolvedTargets,
    targets: resolvedTargets,
    isWorkoutDay: state?.isWorkoutDay ?? false,
    source,
    reason: state?.reason ?? 'Baseline daily targets',
  }
}
