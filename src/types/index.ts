import type { z } from 'zod'
import { BackupPayloadSchema } from '@/schemas/backup.schema'
import { DailyLogSchema } from '@/schemas/dailyLog.schema'
import { FoodSchema } from '@/schemas/food.schema'
import { MealItemSchema, MealSchema } from '@/schemas/meal.schema'
import { ProfileSchema } from '@/schemas/profile.schema'
import { SetSchema, WorkoutSchema } from '@/schemas/workout.schema'

export type Food = z.infer<typeof FoodSchema>
export type MealItem = z.infer<typeof MealItemSchema>
export type Meal = z.infer<typeof MealSchema>
export type Set = z.infer<typeof SetSchema>
export type Workout = z.infer<typeof WorkoutSchema>
export type DailyLog = z.infer<typeof DailyLogSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type BackupPayload = z.infer<typeof BackupPayloadSchema>
