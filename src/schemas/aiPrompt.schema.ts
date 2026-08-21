import { z } from 'zod'

const NonNegativeNumberSchema = z.coerce.number().nonnegative()

export const PromptContextSchema = z.object({
  remainingMacros: z.object({
    calories: NonNegativeNumberSchema,
    protein: NonNegativeNumberSchema,
    carbs: NonNegativeNumberSchema,
    fat: NonNegativeNumberSchema,
  }),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'flexible']),
  pantryFoods: z.array(z.string().min(1)),
  dietaryPreferences: z.array(z.string().min(1)),
  maxIngredients: z.coerce.number().int().positive().default(4),
})
