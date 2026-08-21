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

export const ExerciseDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']),
  defaultRestSeconds: z.number().int().nonnegative(),
})

export const ExerciseSetSchema = z.object({
  setId: z.string().min(1),
  setNumber: z.number().int().positive(),
  type: z.enum(['warmup', 'normal', 'drop', 'failure']),
  weightKg: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  rpe: z.number().min(1).max(10).optional(),
  isCompleted: z.boolean(),
})

export const LoggedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  exerciseName: z.string().min(1),
  sets: z.array(ExerciseSetSchema),
  notes: z.string().optional(),
})

export const WorkoutLogSchema = z.object({
  id: z.string().uuid(),
  date: IsoDateSchema,
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  title: z.string().min(1),
  exercises: z.array(LoggedExerciseSchema),
  estimatedCaloriesBurned: z.number().nonnegative().optional(),
})
