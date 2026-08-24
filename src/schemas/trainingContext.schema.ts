import { z } from 'zod'
import { TrainingModePresetSchema } from '@/schemas/settings.schema'

export const SportTypeSchema = z.union([
  z.enum(['strength', 'hypertrophy', 'cardio', 'mma', 'combat_sport', 'endurance', 'rest']),
  z.string().min(1),
])
export const TrainingIntensitySchema = z.enum(['low', 'moderate', 'high'])
export const SeasonPhaseSchema = z.enum(['offseason', 'competition_prep', 'competition', 'recovery'])

export const TrainingDayContextSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sportType: SportTypeSchema,
  intensity: TrainingIntensitySchema,
  durationMinutes: z.number().int().min(0).max(600),
  seasonPhase: SeasonPhaseSchema,
  customMode: TrainingModePresetSchema.optional(),
  createdAt: z.string().datetime().optional(),
})

export type TrainingDayContextInput = z.input<typeof TrainingDayContextSchema>
export type TrainingDayContextOutput = z.output<typeof TrainingDayContextSchema>
