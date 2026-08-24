import type { z } from 'zod'
import { BackupPayloadSchema } from '@/schemas/backup.schema'
import { DailyLogSchema } from '@/schemas/dailyLog.schema'
import { AllergenTagSchema, FoodSchema, MicronutrientSchema } from '@/schemas/food.schema'
import { MealItemSchema, MealSchema } from '@/schemas/meal.schema'
import { ProfileSchema, ActivityLevelSchema, BiologicalSexSchema, DietaryPatternSchema, FitnessGoalSchema, SweatTypeSchema } from '@/schemas/profile.schema'
import { AppSettingsSchema, ViewModeSchema, AccentSchema, TodayHeroSchema, LocaleSchema, DensitySchema, ReduceMotionSchema } from '@/schemas/settings.schema'
import { ExerciseDefinitionSchema, ExerciseSetSchema, LoggedExerciseSchema, SetSchema, WorkoutLogSchema, WorkoutSchema } from '@/schemas/workout.schema'
import { WeightEntrySchema } from '@/schemas/weightLog.schema'
import { TdeeCalculationResultSchema } from '@/schemas/tdee.schema'
import { PromptContextSchema } from '@/schemas/aiPrompt.schema'
import { AiMealItemSchema, AiMealResponseSchema } from '@/schemas/aiResponse.schema'
import { TrainingDayContextSchema } from '@/schemas/trainingContext.schema'
import { TrainingPlanSchema } from '@/schemas/trainingPlan.schema'

export type Food = z.infer<typeof FoodSchema>
export type Micronutrients = z.infer<typeof MicronutrientSchema>
export type AllergenTag = z.infer<typeof AllergenTagSchema>
export type MealItem = z.infer<typeof MealItemSchema>
export type Meal = z.infer<typeof MealSchema>
export type Set = z.infer<typeof SetSchema>
export type Workout = z.infer<typeof WorkoutSchema>
export type DailyLog = z.infer<typeof DailyLogSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type BiologicalSex = z.infer<typeof BiologicalSexSchema>
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>
export type FitnessGoal = z.infer<typeof FitnessGoalSchema>
export type DietaryPattern = z.infer<typeof DietaryPatternSchema>
export type SweatType = z.infer<typeof SweatTypeSchema>
export type AppSettings = z.infer<typeof AppSettingsSchema>
export type ViewMode = z.infer<typeof ViewModeSchema>
export type AccentName = z.infer<typeof AccentSchema>
export type TodayHero = z.infer<typeof TodayHeroSchema>
export type Locale = z.infer<typeof LocaleSchema>
export type Density = z.infer<typeof DensitySchema>
export type ReduceMotion = z.infer<typeof ReduceMotionSchema>
export type BackupPayload = z.infer<typeof BackupPayloadSchema>
export type PromptContext = z.infer<typeof PromptContextSchema>
export type AiMealItem = z.infer<typeof AiMealItemSchema>
export type AiMealResponse = z.infer<typeof AiMealResponseSchema>
export type ExerciseDefinition = z.infer<typeof ExerciseDefinitionSchema>
export type ExerciseSet = z.infer<typeof ExerciseSetSchema>
export type LoggedExercise = z.infer<typeof LoggedExerciseSchema>
export type WorkoutLog = z.infer<typeof WorkoutLogSchema>
export type WeightEntry = z.infer<typeof WeightEntrySchema>
export type TdeeCalculationResult = z.infer<typeof TdeeCalculationResultSchema>
export type TrainingDayContext = z.infer<typeof TrainingDayContextSchema>
export type TrainingPlan = z.infer<typeof TrainingPlanSchema>
