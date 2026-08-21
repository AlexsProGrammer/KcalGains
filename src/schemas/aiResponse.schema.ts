import { z } from 'zod'

const NonNegativeNumberSchema = z.coerce.number().nonnegative()

export const AiMealItemSchema = z.object({
  name: z.string().min(1),
  grams: NonNegativeNumberSchema,
  calories: NonNegativeNumberSchema,
  protein: NonNegativeNumberSchema,
  carbs: NonNegativeNumberSchema,
  fat: NonNegativeNumberSchema,
})

export const AiMealResponseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  items: z.array(AiMealItemSchema).min(1),
  totalCalories: NonNegativeNumberSchema,
  totalProtein: NonNegativeNumberSchema,
  totalCarbs: NonNegativeNumberSchema,
  totalFat: NonNegativeNumberSchema,
})
