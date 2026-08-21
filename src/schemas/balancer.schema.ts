import { z } from 'zod'

export const MacroTargetSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  priority: z.enum(['balanced', 'protein-first', 'exact-calories']),
})

export const IngredientConstraintSchema = z.object({
  foodId: z.string().min(1),
  minGrams: z.number().nonnegative().default(0),
  maxGrams: z.number().positive().default(1000),
  stepSize: z.number().positive().optional(),
}).refine((constraint) => constraint.maxGrams >= constraint.minGrams, {
  message: 'maxGrams must be greater than or equal to minGrams',
  path: ['maxGrams'],
})

export const BalancerInputSchema = z.object({
  targets: MacroTargetSchema,
  ingredients: z.array(IngredientConstraintSchema).min(1).max(8),
})

const SolutionItemSchema = z.object({
  foodId: z.string().min(1),
  grams: z.number().nonnegative(),
  computedCalories: z.number().nonnegative(),
  computedProtein: z.number().nonnegative(),
  computedCarbs: z.number().nonnegative(),
  computedFat: z.number().nonnegative(),
})

const MacroTotalsSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
})

const MacroDeviationSchema = z.object({
  deltaCalories: z.number(),
  deltaProtein: z.number(),
  deltaCarbs: z.number(),
  deltaFat: z.number(),
})

export const BalancerResultSchema = z.object({
  status: z.enum(['feasible', 'infeasible', 'bounded']),
  solution: z.array(SolutionItemSchema),
  totalMacros: MacroTotalsSchema,
  deviation: MacroDeviationSchema,
})
