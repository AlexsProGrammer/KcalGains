import { z } from 'zod'

export const AllergenTagSchema = z.enum(['gluten', 'lactose', 'nuts', 'soy', 'eggs', 'fish', 'fructose'])

export const MicronutrientSchema = z.object({
  sodiumMg: z.number().nonnegative().optional(),
  potassiumMg: z.number().nonnegative().optional(),
  magnesiumMg: z.number().nonnegative().optional(),
  calciumMg: z.number().nonnegative().optional(),
  zincMg: z.number().nonnegative().optional(),
  ironMg: z.number().nonnegative().optional(),
  seleniumMcg: z.number().nonnegative().optional(),
  vitaminDMcg: z.number().nonnegative().optional(),
  vitaminB6Mg: z.number().nonnegative().optional(),
  vitaminB12Mcg: z.number().nonnegative().optional(),
  vitaminCMg: z.number().nonnegative().optional(),
})

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
  micros: MicronutrientSchema.optional(),
  allergenTags: z.array(AllergenTagSchema).default([]),
  costPer100g: z.number().nonnegative().optional(),
  isCustom: z.boolean(),
  createdAt: z.string().datetime().or(z.string()),
})
