import { z } from 'zod'

export const FoodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  servingSize: z.number().nonnegative(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().default(0),
  micros: z.record(z.string(), z.number()).optional(),
  isCustom: z.boolean(),
  createdAt: z.string().datetime().or(z.string()),
})
