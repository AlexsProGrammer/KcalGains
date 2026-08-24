import { z } from 'zod'

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format')

export const TRAINING_PLAN_DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export const PlannedSetSchema = z.object({
  id: z.string().min(1),
  reps: z.number().int().min(0).max(30).default(0),
  weightKg: z.number().min(0).max(500).default(0),
  rpe: z.number().min(1).max(10).optional(),
  note: z.string().optional(),
})

export const PlannedExerciseSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  name: z.string().min(1),
  notes: z.string().optional(),
  sets: z.array(PlannedSetSchema).default([]),
})

export const TrainingPlanDaySchema = z.object({
  id: z.string().min(1),
  dayKey: z.enum(TRAINING_PLAN_DAY_KEYS),
  label: z.string().min(1),
  trainingMode: z.string().min(1).default('rest'),
  notes: z.string().optional(),
  exercises: z.array(PlannedExerciseSchema).default([]),
})

export const TrainingPlanSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  repeatWeeks: z.number().int().min(1).max(999).default(1),
  weekStart: IsoDateSchema.optional(),
  completedDayIds: z.array(z.string()).default([]),
  days: z.array(TrainingPlanDaySchema).min(7).max(7),
})

export type TrainingPlanDay = z.infer<typeof TrainingPlanDaySchema>
export type PlannedExercise = z.infer<typeof PlannedExerciseSchema>
export type PlannedSet = z.infer<typeof PlannedSetSchema>
export type TrainingPlan = z.infer<typeof TrainingPlanSchema>
export type TrainingPlanOutput = z.output<typeof TrainingPlanSchema>
