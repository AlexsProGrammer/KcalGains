import { z } from 'zod'

export const DailyLogSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format'),
  targetCalories: z.number().nonnegative(),
  targetProtein: z.number().nonnegative(),
  targetCarbs: z.number().nonnegative(),
  targetFat: z.number().nonnegative(),
  caloriesConsumed: z.number().nonnegative().optional(),
  weightKg: z.number().positive().optional(),
  notes: z.string().optional(),
})
