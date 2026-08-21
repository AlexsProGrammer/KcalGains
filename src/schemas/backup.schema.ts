import { z } from 'zod'
import { DailyLogSchema } from '@/schemas/dailyLog.schema'
import { FoodSchema } from '@/schemas/food.schema'
import { MealSchema } from '@/schemas/meal.schema'
import { ProfileSchema } from '@/schemas/profile.schema'
import { WorkoutSchema } from '@/schemas/workout.schema'

export const BackupPayloadSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: z.coerce.date(),
  foods: z.array(FoodSchema),
  meals: z.array(MealSchema),
  workouts: z.array(WorkoutSchema),
  dailyLogs: z.array(DailyLogSchema),
  profile: z.array(ProfileSchema),
})
