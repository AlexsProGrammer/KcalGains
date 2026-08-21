import { z } from 'zod'

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
  heightCm: z.number().positive().optional(),
})
