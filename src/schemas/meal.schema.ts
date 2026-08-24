import { z } from 'zod'
import { MicronutrientSchema } from '@/schemas/food.schema'

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format')

export const MealItemSchema = z.object({
  foodId: z.string().min(1),
  amountInGrams: z.number().positive(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
})

export const MealSchema = z.object({
  id: z.string().min(1),
  date: IsoDateSchema,
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  items: z.array(MealItemSchema),
  totalCalories: z.number().nonnegative(),
  totalProtein: z.number().nonnegative(),
  totalCarbs: z.number().nonnegative(),
  totalFat: z.number().nonnegative(),
  totalMicros: MicronutrientSchema.default({}),
})
