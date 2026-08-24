import { z } from 'zod'
import { DailyLogSchema } from '@/schemas/dailyLog.schema'
import { FoodSchema } from '@/schemas/food.schema'
import { MealSchema } from '@/schemas/meal.schema'
import { ProfileSchema } from '@/schemas/profile.schema'
import { AppSettingsSchema } from '@/schemas/settings.schema'
import { TrainingDayContextSchema } from '@/schemas/trainingContext.schema'
import { TrainingPlanSchema } from '@/schemas/trainingPlan.schema'
import { ExerciseDefinitionSchema, WorkoutLogSchema, WorkoutSchema } from '@/schemas/workout.schema'

export const WorkoutBackupRecordSchema = z.union([WorkoutSchema, WorkoutLogSchema])

export const BackupPayloadSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: z.coerce.date(),
  foods: z.array(FoodSchema).default([]),
  meals: z.array(MealSchema).default([]),
  workouts: z.array(WorkoutBackupRecordSchema).default([]),
  dailyLogs: z.array(DailyLogSchema).default([]),
  profile: z.array(ProfileSchema).default([]),
  settings: z.array(AppSettingsSchema).default([]),
  exerciseDefinitions: z.array(ExerciseDefinitionSchema).default([]),
  trainingContext: z.array(TrainingDayContextSchema).default([]),
  trainingPlans: z.array(TrainingPlanSchema).default([]),
})
