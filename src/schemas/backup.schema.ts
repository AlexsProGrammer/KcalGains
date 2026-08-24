import { z } from 'zod'
import { DailyLogSchema } from '@/schemas/dailyLog.schema'
import { FoodSchema } from '@/schemas/food.schema'
import { MealSchema } from '@/schemas/meal.schema'
import { ProfileSchema } from '@/schemas/profile.schema'
import { AppSettingsSchema } from '@/schemas/settings.schema'
import { TrainingDayContextSchema } from '@/schemas/trainingContext.schema'
import { TrainingPlanSchema } from '@/schemas/trainingPlan.schema'
import { ExerciseDefinitionSchema, WorkoutSchema } from '@/schemas/workout.schema'

export const BackupPayloadSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: z.coerce.date(),
  foods: z.array(FoodSchema),
  meals: z.array(MealSchema),
  workouts: z.array(WorkoutSchema),
  dailyLogs: z.array(DailyLogSchema),
  profile: z.array(ProfileSchema),
  settings: z.array(AppSettingsSchema),
  exerciseDefinitions: z.array(ExerciseDefinitionSchema),
  trainingContext: z.array(TrainingDayContextSchema),
  trainingPlans: z.array(TrainingPlanSchema),
})
