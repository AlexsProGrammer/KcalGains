import { z } from 'zod'

export const PROFILE_SINGLETON_ID = 'primary-profile'

export const BiologicalSexSchema = z.enum(['male', 'female'])

export const ActivityLevelSchema = z.enum(['sedentary', 'light', 'moderate', 'active', 'athlete'])

export const FitnessGoalSchema = z.enum(['lose-fat', 'maintain', 'gain-muscle', 'recomp', 'athletic'])

export const ProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  targetCalories: z.number().nonnegative(),
  targetMacros: z.object({
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fat: z.number().nonnegative(),
  }),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().min(80).max(260).optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  sex: BiologicalSexSchema.optional(),
  activityLevel: ActivityLevelSchema.default('moderate'),
  goal: FitnessGoalSchema.default('maintain'),
  /** Signed weekly body-weight change target; negative for fat loss. */
  goalRateKgPerWeek: z.number().min(-1.5).max(1.5).default(0),
})

export const ACTIVITY_MULTIPLIERS: Record<z.infer<typeof ActivityLevelSchema>, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
}

export const GOAL_DEFAULT_RATES: Record<z.infer<typeof FitnessGoalSchema>, number> = {
  'lose-fat': -0.5,
  maintain: 0,
  'gain-muscle': 0.25,
  recomp: 0,
  athletic: 0,
}
