import { z } from 'zod'

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format')

export const SetSchema = z.object({
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
  rpe: z.number().min(1).max(10).optional(),
})

export const WorkoutSchema = z.object({
  id: z.string().min(1),
  date: IsoDateSchema,
  title: z.string().min(1),
  type: z.enum(['strength', 'cardio', 'other']),
  durationMinutes: z.number().nonnegative(),
  caloriesBurned: z.number().nonnegative().optional(),
  sets: z.array(SetSchema),
})
